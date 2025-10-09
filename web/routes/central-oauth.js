// web/routes/central-oauth.js
import express from "express";
import crypto from "crypto";
import axios from "axios";
import { supabase } from "../supabase.js";
import shopify from "../shopify.js";

export const centralOAuthRouter = express.Router();

// HMAC state helpers
function packState(shop) {
  const nonce = crypto.randomBytes(12).toString("hex");
  const payload = `${shop}:${nonce}`;
  const sig = crypto.createHmac("sha256", process.env.CENTRAL_OAUTH_STATE_SECRET)
    .update(payload).digest("hex");
  return `${payload}:${sig}`;
}
function unpackState(state) {
  if (!state) return null;
  const parts = state.split(":");
  if (parts.length !== 3) return null;
  const [shop, nonce, sig] = parts;
  const payload = `${shop}:${nonce}`;
  const expect = crypto.createHmac("sha256", process.env.CENTRAL_OAUTH_STATE_SECRET)
    .update(payload).digest("hex");

  // timingSafeEqual requires same-length buffers (hex digests are fixed length)
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? shop : null;
}

// GET /api/central/oauth/start
centralOAuthRouter.get(
  "/api/central/oauth/start",
  async (req, res) => {
    try {
      console.log("🚀 [central:start] query:", req.query);
      // Prefer explicit shop param from the top-level window, fallback to session if available
      const shopParam = req.query?.shop ? String(req.query.shop) : null;
      const sessionShop = res?.locals?.shopify?.session?.shop || null;
      const shop = shopParam || sessionShop;

      if (!shop) {
        console.warn("⚠️ [central:start] missing shop; sessionShop=", sessionShop);
        return res.status(400).send("Missing shop");
      }

      const state = packState(shop);

      const url = new URL(process.env.CENTRAL_CONNECT_URL); // your Central UI page
      url.searchParams.set("client_id", process.env.SHOPIFY_OAUTH_CLIENT_ID);
      url.searchParams.set("redirect_uri", process.env.CENTRAL_OAUTH_REDIRECT_URI);
      url.searchParams.set("scope", "read:workspaces");
      url.searchParams.set("state", state);
      console.log("🧭 [central:start] redirect →", url.toString());
      return res.redirect(url.toString()); // top-level redirect out of iframe
    } catch (e) {
      console.error("central oauth start error:", e);
      return res.status(500).send("Failed to start Central OAuth");
    }
  }
);

// Public (no Shopify session) fetch of chatbots using stored Central token
centralOAuthRouter.get("/api/chatbots", async (req, res) => {

  try {

    const workspaceId = String(req.query?.workspace_id || "").trim();
    const shop = String(req.query?.shop || "").trim();
    console.log("🤖 [chatbots] params:", { workspaceId, shop });

    if (!workspaceId) return res.status(400).json({ error: "Missing workspace_id" });
    if (!shop) return res.status(400).json({ error: "Missing shop" });

    // Ensure the shop exists in our DB (basic guard)
    const { data: shopRow, error: shopErr } = await supabase
      .from("chats_shopify_shops")
      .select("shop_domain")
      .eq("shop_domain", shop)
      .maybeSingle();
    console.log("🧪 [chatbots] shopRow:", shopRow, "err:", shopErr || null);
    if (shopErr) return res.status(500).json({ error: "Failed to validate shop" });
    if (!shopRow) return res.status(401).json({ error: "Unknown shop" });

    // Lookup Central user_id linked to this shop
    const { data: linked, error: linkErr } = await supabase
      .from("chats_shopify_shops")
      .select("central_user_id")
      .eq("shop_domain", shop)
      .maybeSingle();
    console.log("🧩 [chatbots] linked:", linked, "err:", linkErr || null);
    if (linkErr) return res.status(500).json({ error: "Failed to read linked user" });
    const centralUserId = linked?.central_user_id || null;
    if (!centralUserId) return res.status(401).json({ error: "No Central user linked" });

    // Read Central OAuth tokens from oauth_tokens (managed by Central backend)
    const nowIso = new Date().toISOString();
    const { data: tokensRows, error: tokErr } = await supabase
      .from("oauth_tokens")
      .select("access_token, refresh_token, access_token_expires_at, refresh_token_expires_at")
      .eq("user_id", centralUserId)
      .eq("client_id", process.env.SHOPIFY_OAUTH_CLIENT_ID)
      .order("access_token_expires_at", { ascending: false })
      .limit(1);
    console.log("🔑 [chatbots] tokensRows:", Array.isArray(tokensRows) ? tokensRows.length : null, tokErr || null);
    if (tokErr) return res.status(500).json({ error: "Failed to read tokens" });
    const tok = tokensRows && tokensRows[0];
    if (!tok) return res.status(401).json({ error: "No Central token found" });



    let accessToken = tok.access_token;
    const isAccessValid = tok.access_token_expires_at && tok.access_token_expires_at > nowIso;
    const canRefresh = tok.refresh_token_expires_at && tok.refresh_token_expires_at > nowIso && tok.refresh_token;
    console.log("⏱️ [chatbots] token valid:", !!isAccessValid, "canRefresh:", !!canRefresh);
    if (!isAccessValid && canRefresh) {
      try {
        const r = await axios.post(process.env.CENTRAL_OAUTH_TOKEN_URL, {
          grant_type: "refresh_token",
          refresh_token: tok.refresh_token,
          client_id: process.env.SHOPIFY_OAUTH_CLIENT_ID,
          client_secret: process.env.SHOPIFY_OAUTH_CLIENT_SECRET,
        }, { headers: { "Content-Type": "application/json" }, timeout: 15000 });
        accessToken = r.data?.access_token || accessToken;
        console.log("🔄 [chatbots] refreshed token success:", Boolean(r.data?.access_token));
      } catch (refreshErr) {
        console.error("Central token refresh failed:", refreshErr?.response?.data || refreshErr?.message || refreshErr);
      }
    }
    if (!accessToken) return res.status(401).json({ error: "Central access token unavailable" });
    console.log("📡 [chatbots] fetching chatbots… workspace:", workspaceId);
    const resp = await axios.get(
      `${process.env.CENTRAL_CSR_BACKEND_URL}/api/chatbot/all/oAuth`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-workspace-id": workspaceId,
        },
        timeout: 15000,
      }
    );
    console.log("📦 [chatbots] resp status:", resp.status, "items:", Array.isArray(resp.data) ? resp.data.length : null);
    const chatbots = Array.isArray(resp.data) ? resp.data : [];
    return res.json({ chatbots });
  } catch (e) {
    console.error("GET /api/chatbots (public) error", e?.response?.data || e);
    return res.status(500).json({ error: "Failed to fetch chatbots" });
  }
});

// GET /api/central/oauth/callback?code=...&state=...
centralOAuthRouter.get("/api/central/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log("🎯 [central:callback] query:", req.query);
    if (!code || !state) return res.status(400).send("Missing code/state");

    const shop = unpackState(String(state));
    
    if (!shop) return res.status(400).send("Invalid state");

    console.log("🧾 [central:callback] shop:", shop, "redirect_uri:", process.env.CENTRAL_OAUTH_REDIRECT_URI, "token_url:", process.env.CENTRAL_OAUTH_TOKEN_URL);

    const tokenRes = await axios.post(process.env.CENTRAL_OAUTH_TOKEN_URL, {
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: process.env.CENTRAL_OAUTH_REDIRECT_URI,
      client_id: process.env.SHOPIFY_OAUTH_CLIENT_ID,
      client_secret: process.env.SHOPIFY_OAUTH_CLIENT_SECRET,
      shop_domain: shop, // lets Central link shop → user/workspace
    }, { headers: { "Content-Type": "application/json" }, timeout: 15000 });

    console.log("✅ [central:callback] token status:", tokenRes.status, "keys:", Object.keys(tokenRes.data || {}));
    // Tokens are stored by Central in oauth_tokens; no need to duplicate in widget_config

    // Redirect through the app's Shopify auth entry to ensure a valid session
    // This avoids "ensureInstalledOnShop did not receive a shop query argument"
    // by explicitly providing the shop domain to the app middleware.
    console.log("↪️ [central:callback] redirect → /api/auth?shop=…", shop);
    return res.redirect(`/api/auth?shop=${encodeURIComponent(shop)}`);
  } catch (e) {
    console.error("❌ [central:callback] error:", e?.response?.data || e);
    return res.status(500).send("Central authorization failed");
  }
});
