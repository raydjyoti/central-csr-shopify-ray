// @ts-check
import "dotenv/config";
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import { supabase } from "./supabase.js";
import { DeliveryMethod } from "@shopify/shopify-api";
import { settingsRouter } from "./routes/settings.js";
import { centralOAuthRouter } from "./routes/central-oauth.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());


app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      const { shop, accessToken, scope } = session;

      console.log("session:", session, "🟡");

      // Save install (update-then-insert to avoid requiring a unique constraint)
      const nowIso = new Date().toISOString();
      const updateResult = await supabase
        .from("chats_shopify_shops")
        .update({
          access_token: accessToken,
          scope,
          updated_at: nowIso,
        })
        .eq("shop_domain", shop)
        .select("shop_domain");

      if (updateResult.error) {
        console.error("Supabase update error:", updateResult.error);
        res.status(500).send("Failed to save shop session");
        return;
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        const insertResult = await supabase
          .from("chats_shopify_shops")
          .insert({
            shop_domain: shop,
            access_token: accessToken,
            scope,
            updated_at: nowIso,
          });

        if (insertResult.error) {
          console.error("Supabase insert error:", insertResult.error);
          res.status(500).send("Failed to save shop session");
          return;
        }
      }

      // Register webhooks for this shop
      await shopify.api.webhooks.addHandlers({
        APP_UNINSTALLED: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: shopify.config.webhooks.path, // '/webhooks'
        },
        CUSTOMERS_DATA_REQUEST: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: shopify.config.webhooks.path,
        },
        CUSTOMERS_REDACT: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: shopify.config.webhooks.path,
        },
        SHOP_REDACT: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: shopify.config.webhooks.path,
        },
      });

      // continue to the built-in redirect middleware
      next();
      return;
    } catch (err) {
      console.error("Error during Shopify auth callback handling:", err);
      res.status(500).send("Internal error during Shopify auth callback");
      return;
    }
  },
  shopify.redirectToShopifyOrAppRoot()
);



app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({
    webhookHandlers: {
      ...PrivacyWebhookHandlers, // existing GDPR topics
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: shopify.config.webhooks.path,
        callback: async (topic, shop /*, body, webhookId */) => {
          try {
            await supabase.from("chats_shopify_shops").delete().eq("shop_domain", shop);
            // await supabase.from("chats_shopify_settings").delete().eq("shop_domain", shop);
            console.log(`Cleaned up data for ${shop} on uninstall`);
          } catch (e) {
            console.error("APP_UNINSTALLED cleanup error:", e);
          }
        },
      },
    },
  })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use(express.json());

// Mount Central OAuth routes before the generic /api session guard so the
// callback can work without a Shopify session, while the start route still
// validates via its own middleware.
app.use(centralOAuthRouter);
app.use("/api", shopify.validateAuthenticatedSession());
app.use(settingsRouter);


app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use(/^(?!\/api).*/, shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
