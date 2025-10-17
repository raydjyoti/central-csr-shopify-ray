// web/routes/settings.js
import express from "express";
import { supabase } from "../supabase.js";
import { getMongoClient, getMongoDb } from "../mongodb.js";
import { ObjectId } from "mongodb";
import axios from "axios";
import shopify from "../shopify.js";

export const settingsRouter = express.Router();
// Serve a small JS that sets window.ChatWidgetConfig and CSR widget base
settingsRouter.get("/api/widget-config.js", (req, res) => {
  try {
    const chatAgentId = String(req.query?.chatAgentId || "").trim();
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    const allowedOrigins = (process.env.SHOPIFY_WIDGET_ALLOWED_ORIGINS || "onrender.com,trycentral.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const js = `
      // Central widget runtime config
      window.ChatWidgetConfig = { chatAgentId: ${JSON.stringify(chatAgentId)}, siteUrl: window.location.href };
      // Bridge: handle add-to-cart from cross-origin widget via postMessage
      (function(){
        var ALLOWED = ${JSON.stringify(allowedOrigins)};
        function isAllowed(origin){
          try { var h = new URL(origin).hostname; return ALLOWED.some(function(s){ return h === s || h.endsWith('.' + s); }); } catch (e) { return false; }
        }
        try { console.debug('[Central Bridge] Installed. Allowed:', ALLOWED); window.CentralBridgeReady = true; } catch(_){}
        window.addEventListener('message', function(e){
          if (!isAllowed(e.origin)) return;
          var msg = e.data || {};
          if (msg && msg.type === 'CENTRAL_ADD_TO_CART' && msg.id) {
            try { console.debug('[Central Bridge] ATC received', msg); } catch(_){ }
            fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ id: String(msg.id), quantity: msg.quantity || 1 })
            }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, json: j }; }); })
              .then(function(res){
                if (e.source && e.origin) {
                  e.source.postMessage({ type: 'CENTRAL_ADD_TO_CART_OK', id: msg.id, data: res.json }, e.origin);
                }
                try { window.dispatchEvent(new CustomEvent('central:cart:added', { detail: { variantId: msg.id, quantity: msg.quantity || 1 } })); } catch(_){ }
              })
              .catch(function(err){
                try { console.error('[Central Bridge] ATC failed', err); } catch(_){ }
                if (e.source && e.origin) {
                  e.source.postMessage({ type: 'CENTRAL_ADD_TO_CART_ERR', id: msg.id, error: String(err && err.message || err) }, e.origin);
                }
              });
          }
        });
      })();
    `;
    res.status(200).send(js);
  } catch (e) {
    res.status(200).send("// widget config error");
  }
});

// Read settings
settingsRouter.get(
  "/api/settings",
  shopify.validateAuthenticatedSession(),
  async (_req, res) => {
    try {
      const shop = res.locals.shopify.session.shop;
      const { data, error } = await supabase
        .from("chats_shopify_settings")
        .select("*")
        .eq("shop_domain", shop)
        .maybeSingle();
      if (error) return res.status(500).json({ error: "DB error" });

      // Also fetch connection info from chats_shopify_shops (central_user_id is set after OAuth)
      const { data: shopRow, error: shopErr } = await supabase
        .from("chats_shopify_shops")
        .select("central_user_id")
        .eq("shop_domain", shop)
        .maybeSingle();

      if (shopErr) console.error("GET /api/settings shopRow error", shopErr);


      // If we have a linked Central user, fetch their workspaces list for selection
      let workspaces = [];
      if (shopRow?.central_user_id) {
        const { data: wsLinks, error: wsErr } = await supabase
          .from("user_workspaces")
          .select("workspace_id, workspaces ( id, name )")
          .eq("user_id", shopRow.central_user_id);
        if (wsErr) {
          console.error("GET /api/settings workspaces error", wsErr);
        } else if (Array.isArray(wsLinks)) {
          workspaces = wsLinks
            .map((link) => link?.workspaces)
            .filter(Boolean)
            .map((w) => ({ id: w.id, name: w.name }));
        }
      }

      const responsePayload = (
        data ?? {
          shop_domain: shop,
          chat_agent_id: null,
          workspace_id: null,
          workspace_status: "pending",
          widget_enabled: false,
          widget_config: {},
        }
      );

      // Merge central_user_id for frontend to detect connection state
      const response = {
        ...responsePayload,
        central_user_id: shopRow?.central_user_id ?? null,
        workspaces,
      };

      res.json(response);
    } catch (e) {
      console.error("GET /api/settings error", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Upsert settings
settingsRouter.post(
  "/api/settings",
  express.json(),
  shopify.validateAuthenticatedSession(),
  async (req, res) => {
    try {
      const shop = res.locals.shopify.session.shop;
      const { chat_agent_id, workspace_id, widget_enabled } = req.body || {};


      // Read → update or insert to ensure a row is always returned
      const { data: existing, error: readErr } = await supabase
        .from("chats_shopify_settings")
        .select("*")
        .eq("shop_domain", shop)
        .maybeSingle();

      if (readErr) return res.status(500).json({ error: "DB error" });

      const payload = {
        shop_domain: shop,
        chat_agent_id: chat_agent_id ?? null,
        workspace_id: workspace_id ?? null,
        updated_at: new Date().toISOString(),
      };

      // Only include widget_enabled if provided (so we don't overwrite unintentionally)
      if (typeof widget_enabled !== "undefined") {
        payload.widget_enabled = !!widget_enabled;
      }

      let saved = null;
      if (existing) {
        const { data: upd, error: updErr } = await supabase
          .from("chats_shopify_settings")
          .update(payload)
          .eq("shop_domain", shop)
          .select("*")
          .maybeSingle();

        if (updErr) return res.status(500).json({ error: "DB error" });
        saved = upd;
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("chats_shopify_settings")
          .insert(payload)
          .select("*")
          .maybeSingle();

        if (insErr) return res.status(500).json({ error: "DB error" });
        saved = ins;
      }

      // Attach latest central_user_id so client state is immediately accurate after save
      const { data: shopRow, error: shopErr } = await supabase
        .from("chats_shopify_shops")
        .select("central_user_id")
        .eq("shop_domain", shop)
        .maybeSingle();
      if (shopErr) console.error("POST /api/settings shopRow error", shopErr);


      // Mount or update the storefront widget via ScriptTag
      try {
        const session = res.locals.shopify.session;
        const rest = new shopify.api.clients.Rest({ session });

        // Remove existing tags that point to our widget loader
        const listResp = await rest.get({ path: 'script_tags' });
        const allTags = (listResp?.body?.script_tags || listResp?.data?.script_tags || []);
        const staleTags = allTags.filter((t) => {
          const src = String(t?.src || "");
          return src.includes('/chat-widget-loader.js') || src.includes('/api/widget-config.js');
        });
        for (const tag of staleTags) {
          try { await rest.delete({ path: `script_tags/${tag.id}` }); } catch (e) { /* ignore */ }
        }
      // Always create the config/bridge script so postMessage add-to-cart works even if widget is disabled
      const enabledState = typeof widget_enabled !== "undefined" ? !!widget_enabled : !!saved?.widget_enabled;
      const agentId = saved?.chat_agent_id || chat_agent_id || '';
      const widgetBase = (process.env.CENTRAL_CSR_WIDGET || '').replace(/\/$/, '');
      const version = Date.now();
      const configUrl = `${widgetBase}/api/widget-config.js?chatAgentId=${encodeURIComponent(agentId)}&v=${version}`;
      await rest.post({
        path: 'script_tags',
        data: {
          script_tag: {
            event: 'onload',
            src: configUrl,
            display_scope: 'online_store',
          },
        },
        type: 'application/json',
      });

      // Loader is only needed when widget is enabled and an agent is selected
      if ((saved?.chat_agent_id || chat_agent_id) && enabledState) {
        const loaderUrl = `${widgetBase}/chat-widget-loader.js?chatAgentId=${encodeURIComponent(agentId)}&v=${version}`;
        await rest.post({
          path: 'script_tags',
          data: {
            script_tag: {
              event: 'onload',
              src: loaderUrl,
              display_scope: 'online_store',
            },
          },
          type: 'application/json',
        });
      }
      } catch (mountErr) {
        console.error('Failed to mount widget ScriptTag:', mountErr?.response?.data || mountErr);
      }

      // Reflect Shopify store domain on the selected chatbot in MongoDB
      try {
        const agentId = saved?.chat_agent_id || chat_agent_id;
        if (agentId) {
          const db = await getMongoDb();
          const chatbotsCol = db.collection('chatbots');

          try {
            const collections = await db.listCollections({ name: 'chatbots' }).toArray();
            // Probe for the document
            let byObjectId = false;
            try {
              const probeObjId = await chatbotsCol.findOne({ _id: new ObjectId(String(agentId)) });
              byObjectId = Boolean(probeObjId);
            } catch {}
            const probeStr = await chatbotsCol.findOne({ _id: String(agentId) });

          } catch (dbgErr) {
            console.warn('[MongoDBG] debug failed:', dbgErr?.message || dbgErr);
          }

          let matched = 0;
          // Try ObjectId match first
          try {
            const resObjId = await chatbotsCol.updateOne(
              { _id: new ObjectId(String(agentId)) },
              { $set: { shopifyStoreName: shop } }
            );
            matched = resObjId?.matchedCount || 0;
          } catch {
            // ignore invalid ObjectId
          }

          // Fallback: string _id
          if (matched === 0) {
            await chatbotsCol.updateOne(
              { _id: String(agentId) },
              { $set: { shopifyStoreName: shop } }
            );
          }
        }
      } catch (mongoErr) {
        console.error('Failed to update chatbot shopifyStoreName in MongoDB:', mongoErr);
      }

      const out = { ...saved, central_user_id: shopRow?.central_user_id ?? null };
      res.json(out);
    } catch (e) {
      console.error("POST /api/settings error", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Removed: session-guarded /api/chatbots; proxy now in central-oauth router
