### Shopify OAuth Setup (Read-only Admin API)

Add the following to your backend `.env`:

```
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
SHOPIFY_API_KEY=your_app_client_id
SHOPIFY_API_SECRET=your_app_client_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers,read_content,read_themes,read_locations,read_analytics
```

In Shopify Partners → App → App setup:

- App URL: `http://localhost:3000`
- Allowed redirection URL(s): `http://localhost:3000/api/shopify/callback`

Flow:

- Frontend button prompts for shop domain and redirects to `/api/shopify/auth?shop=...`.
- After authorization, Shopify redirects to `/api/shopify/callback` which stores the access token in-memory and redirects back to the frontend with a `shopify_connected=true` flag.
- Verify connection and fetch store basics with: `GET /api/shopify/me?shop=<shop>.myshopify.com`.

Note: In-memory token storage is for local/testing. Use your DB for persistence in production.
