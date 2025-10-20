import express from "express";
import crypto from "crypto";
import shopify from "../shopify.js";

export const webhooksRouter = express.Router();

// Build raw-body parser scoped to these webhook routes only
const rawJson = express.raw({ type: "application/json" });

const getAppSecret = () => process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";

function verifyHmac(req) {
  try {
    const hmacHeader = req.get("X-Shopify-Hmac-Sha256") || req.get("x-shopify-hmac-sha256") || "";
    const secret = getAppSecret();
    const digest = crypto.createHmac("sha256", secret).update(req.body).digest("base64");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch (e) {
    return false;
  }
}

// Fast 200 helper
function ok(res) {
  try { return res.status(200).send("OK"); } catch { return res.end(); }
}

// customers/data_request
webhooksRouter.post("/webhooks/customers/data_request", rawJson, (req, res) => {
  if (!verifyHmac(req)) return res.status(401).send("Invalid HMAC");
  try {
    const payload = JSON.parse(String(req.body || "{}"));
    // This app does not persist customer PII outside Shopify. No data to export.
    // If you later store data, enqueue an export job here scoped to payload.customer.id/email for this shop.
    // console.log("GDPR data_request (no-op)", payload?.shop_domain, payload?.customer?.email);
  } catch {}
  try {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ ok: true, dataStored: false }));
  } catch { return ok(res); }
});

// customers/redact
webhooksRouter.post("/webhooks/customers/redact", rawJson, (req, res) => {
  if (!verifyHmac(req)) return res.status(401).send("Invalid HMAC");
  try {
    const payload = JSON.parse(String(req.body || "{}"));
    // This app does not persist customer PII outside Shopify. Nothing to delete.
    // If you later store data, enqueue deletion for this customer/shop here.
    // console.log("GDPR customers_redact (no-op)", payload?.shop_domain, payload?.customer?.email);
  } catch {}
  try {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ ok: true, dataStored: false }));
  } catch { return ok(res); }
});

// shop/redact
webhooksRouter.post("/webhooks/shop/redact", rawJson, (req, res) => {
  if (!verifyHmac(req)) return res.status(401).send("Invalid HMAC");
  try {
    const payload = JSON.parse(String(req.body || "{}"));
    // This app does not persist store data requiring redaction. Nothing to delete.
    // If you later store per-shop data, enqueue a purge here.
    // console.log("GDPR shop_redact (no-op)", payload?.shop_domain);
  } catch {}
  try {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ ok: true, dataStored: false }));
  } catch { return ok(res); }
});

// Helper to (re)register mandatory webhooks for a session
export async function registerMandatoryWebhooks(session, appBaseUrl) {
  const client = new shopify.api.clients.Graphql({ session });

  const ensureSub = async (topic, path) => {
    const callbackUrl = `${appBaseUrl.replace(/\/$/, "")}${path}`;
    const mutation = `#graphql
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }) {
          userErrors { field message }
          webhookSubscription { id }
        }
      }
    `;
    const resp = await client.request(mutation, { variables: { topic, callbackUrl } });
    const errs = resp?.data?.webhookSubscriptionCreate?.userErrors;
    if (Array.isArray(errs) && errs.length) {
      // Attempt update if already exists
      const listQ = `#graphql
        query listSubs($topic: WebhookSubscriptionTopic!) {
          webhookSubscriptions(first: 1, topics: [$topic]) { edges { node { id } } }
        }
      `;
      const list = await client.request(listQ, { variables: { topic } });
      const existingId = list?.data?.webhookSubscriptions?.edges?.[0]?.node?.id;
      if (existingId) {
        const upd = `#graphql
          mutation webhookSubscriptionUpdate($id: ID!, $callbackUrl: URL!) {
            webhookSubscriptionUpdate(id: $id, webhookSubscription: { callbackUrl: $callbackUrl }) {
              userErrors { field message }
              webhookSubscription { id }
            }
          }
        `;
        await client.request(upd, { variables: { id: existingId, callbackUrl } });
      }
    }
  };

  await ensureSub("CUSTOMERS_DATA_REQUEST", "/webhooks/customers/data_request");
  await ensureSub("CUSTOMERS_REDACT", "/webhooks/customers/redact");
  await ensureSub("SHOP_REDACT", "/webhooks/shop/redact");
}
