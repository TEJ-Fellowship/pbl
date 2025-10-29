import express from "express";
import {
  buildAuthUrl,
  verifyHmac,
  exchangeToken,
  getAccessToken,
  getShop,
  getProductsCount,
  getOrdersCount,
} from "../src/services/shopifyOAuth.js";

const router = express.Router();

// Start OAuth flow
router.get("/auth", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop)
      return res.status(400).json({ error: "Missing 'shop' query param" });
    const { url } = buildAuthUrl(shop);
    return res.redirect(url);
  } catch (err) {
    console.error("Shopify auth error:", err);
    return res
      .status(500)
      .json({ error: "Failed to start OAuth", message: err.message });
  }
});

// OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { shop, code, state, hmac } = req.query;
    if (!shop || !code || !hmac) {
      return res.status(400).send("Missing required OAuth parameters");
    }
    const valid = verifyHmac(req.query);
    if (!valid) return res.status(400).send("Invalid HMAC signature");

    await exchangeToken(shop, code);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    // Redirect back with a simple success flag and shop domain
    const redirect = new URL(frontendUrl);
    redirect.searchParams.set("shopify_connected", "true");
    redirect.searchParams.set("shop", shop);
    return res.redirect(redirect.toString());
  } catch (err) {
    console.error("Shopify callback error:", err);
    return res.status(500).send("OAuth callback failed");
  }
});

// Verify connection and return basic store info and a few counts
router.get("/me", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop)
      return res.status(400).json({ error: "Missing 'shop' query param" });
    if (!getAccessToken(shop))
      return res.status(401).json({ connected: false, error: "Not connected" });

    const [shopInfo, productsCount, ordersCount] = await Promise.all([
      getShop(shop),
      getProductsCount(shop),
      getOrdersCount(shop),
    ]);

    return res.json({
      connected: true,
      shop: shopInfo?.shop || shopInfo,
      productsCount: productsCount?.count ?? null,
      ordersCount: ordersCount?.count ?? null,
    });
  } catch (err) {
    console.error("Shopify me error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch shop data", message: err.message });
  }
});

export default router;
