import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

// Derive hostName explicitly so production doesn't rely on implicit env parsing
function coerceUrl(value) {
  if (!value) return null;
  try {
    // Allow values without protocol (e.g., myapp.up.railway.app)
    const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProto).href;
  } catch {
    return null;
  }
}

const candidateUrls = [
  process.env.HOST,
  process.env.SHOPIFY_APP_URL,
  process.env.APP_URL,
  process.env.RAILWAY_STATIC_URL,
  process.env.VERCEL_URL,
  process.env.RENDER_EXTERNAL_URL,
];

let derivedHostName;
for (const c of candidateUrls) {
  const u = coerceUrl(c);
  if (u) { derivedHostName = new URL(u).host; break; }
}

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    hostName: derivedHostName,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;
