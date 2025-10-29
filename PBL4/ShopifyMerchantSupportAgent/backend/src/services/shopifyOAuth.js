import crypto from "crypto";
import axios from "axios";

// Simple in-memory token store per shop. Replace with DB for production.
const shopToToken = new Map();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildAuthUrl(shop, state, redirectUriOverride) {
  const apiKey = getRequiredEnv("SHOPIFY_API_KEY");
  const scopes =
    process.env.SHOPIFY_SCOPES ||
    "read_products,read_orders,read_customers,read_content,read_themes,read_locations,read_analytics";
  const backendUrl =
    redirectUriOverride ||
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const redirectUri = encodeURIComponent(`${backendUrl}/api/shopify/callback`);
  const nonce = state || crypto.randomBytes(16).toString("hex");
  const sanitizedShop = shop.endsWith(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;

  const url = `https://${sanitizedShop}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${redirectUri}&state=${nonce}`;
  return { url, state: nonce, shop: sanitizedShop };
}

export function verifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(
      (key) =>
        `${key}=${Array.isArray(rest[key]) ? rest[key].join(",") : rest[key]}`
    )
    .join("&");

  const generated = crypto
    .createHmac("sha256", getRequiredEnv("SHOPIFY_API_SECRET"))
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generated, "utf-8"),
    Buffer.from(hmac, "utf-8")
  );
}

export async function exchangeToken(shop, code) {
  const sanitizedShop = shop.endsWith(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;
  const tokenUrl = `https://${sanitizedShop}/admin/oauth/access_token`;
  const res = await axios.post(tokenUrl, {
    client_id: getRequiredEnv("SHOPIFY_API_KEY"),
    client_secret: getRequiredEnv("SHOPIFY_API_SECRET"),
    code,
  });
  const accessToken = res.data.access_token;
  if (!accessToken) throw new Error("No access_token returned by Shopify");
  shopToToken.set(sanitizedShop, accessToken);
  return { shop: sanitizedShop, accessToken };
}

export function getAccessToken(shop) {
  const sanitizedShop = shop.endsWith(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;
  return shopToToken.get(sanitizedShop);
}

async function shopifyGet(shop, path) {
  const token = getAccessToken(shop);
  if (!token) throw new Error("Shop not connected. Please complete OAuth.");
  const baseUrl = `https://${
    shop.endsWith(".myshopify.com") ? shop : `${shop}.myshopify.com`
  }`;
  const url = `${baseUrl}/admin/api/2024-10/${path}`;
  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function getShop(shop) {
  return await shopifyGet(shop, "shop.json");
}

export async function getProductsCount(shop) {
  return await shopifyGet(shop, "products/count.json");
}

export async function getOrdersCount(shop) {
  return await shopifyGet(shop, "orders/count.json");
}

export default {
  buildAuthUrl,
  verifyHmac,
  exchangeToken,
  getAccessToken,
  getShop,
  getProductsCount,
  getOrdersCount,
};
