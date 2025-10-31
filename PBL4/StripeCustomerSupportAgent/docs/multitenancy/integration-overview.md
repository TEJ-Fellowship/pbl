# Multitenancy Integration Overview

- Architecture: Single app instance; PostgreSQL uses one schema per tenant (`tenant_{slug}`) for strict isolation. A global schema holds shared tables (e.g., `public.tenants`, `global.analytics`).
- Request flow:
  1. Resolve tenant from subdomain, JWT, or API key.
  2. Set `search_path` to the tenant’s schema.
  3. Use tenant-scoped Stripe config, ticket tables, and RAG indices.
  4. Reset `search_path`.

---

## Stripe — Per-Tenant Payments & Customer Data

- Per-tenant config (global): `tenants(id, name, slug, stripe_account_id, stripe_webhook_secret, rag_index_namespace, created_at, updated_at)`
- Access pattern:
  - Prefer Stripe Connect: store `stripe_account_id` per tenant; call Stripe with your platform secret and `{ stripeAccount: <id> }`.
  - Webhooks: verify using each tenant’s `stripe_webhook_secret`.
- Isolation:
  - Operational data (customers, tickets, chat logs) lives in tenant schemas.
  - Only store minimal Stripe identifiers globally (e.g., `stripe_account_id`).

Example middleware and Stripe usage:

```javascript
// middleware/tenant.js
export async function tenantMiddleware(req, res, next) {
  const slug = resolveTenantSlug(req); // subdomain/JWT/header
  const tenant = await db
    .query("SELECT * FROM tenants WHERE slug = $1", [slug])
    .then((r) => r.rows[0]);
  if (!tenant) return res.status(404).send("Unknown tenant");

  req.tenant = tenant;
  await db.query(`SET search_path TO tenant_${tenant.slug}, public`);
  res.on("finish", () => db.query("RESET search_path").catch(() => {}));
  next();
}

// services/stripe.js
import Stripe from "stripe";
export function stripeForTenant(tenant) {
  const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET);
  return {
    createCharge: (params) =>
      stripe.charges.create(params, {
        stripeAccount: tenant.stripe_account_id,
      }),
    // add more methods similarly, always passing { stripeAccount }
  };
}
```

Webhook verification:

```javascript
// routes/webhooks.js
import Stripe from "stripe";

router.post("/webhooks", rawBody, async (req, res) => {
  const tenant = await resolveTenantFromWebhook(req); // header/route key
  const stripe = new Stripe(process.env.STRIPE_PLATFORM_SECRET);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      tenant.stripe_webhook_secret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  await db.query(`SET search_path TO tenant_${tenant.slug}, public`);
  // handle event -> write to tenant tables
  await db.query("RESET search_path");
  res.sendStatus(200);
});
```

---

## Support Tickets — Issues & Chat Logs

Per-tenant tables (in each `tenant_{slug}` schema). These are cloned from a `base_template` during tenant provisioning.

```sql
-- base_template schema (copied into each tenant schema on signup)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  issue TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  role TEXT CHECK (role IN ('user','agent','system')),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

APIs (respect current `search_path` set by middleware):

- `POST /api/tickets` → insert into `tickets`
- `POST /api/tickets/:id/messages` → insert into `messages`
- `GET /api/tickets` → list tenant tickets

---

## RAG + MCP — AI-Assisted Support

- Per-tenant vector namespace: `tenant_{slug}_docs` (e.g., Pinecone) to isolate embeddings and retrieval.
- Retrieval:
  - Query tenant namespace (optionally include `global` docs when safe).
  - Hybrid retrieval and reranking run within tenant scope to prevent leakage.
- Prompt context:
  - Include tenant metadata (branding, policies) and live ticket context from tenant tables.
- MCP tools:
  - Global tools (web search, status, calculator) remain tenant-agnostic.
  - Any data-reading/writing tool must receive `tenant.slug` and use tenant-limited resources.
- Guardrails:
  - Do not merge chunks across tenants.
  - Mask PII before logging; store feedback/analytics in `global` keyed by `tenant_id`.

Retriever sketch:

```javascript
export async function retrieveForTenant(tenant, query, k = 4) {
  const namespace = tenant.rag_index_namespace; // e.g., 'tenant_alpha_docs'
  const semantic = await vectorStore.query({ query, topK: 10, namespace });
  const keyword = await bm25Index[tenant.slug].search(query, 10);
  const ranked = fuse(semantic, keyword); // fusion within tenant only
  return ranked.slice(0, k);
}
```

---

## Why Separate Schema Is Best

- Data Privacy: Each company’s customers, transactions, and tickets are isolated by schema.
- Compliance: Stripe-related records (events, logs, reconciliations) are segregated for simpler audits.
- Easy Backups: Backup/restore at schema granularity without impacting others.
- Debugging: Use `SET search_path TO tenant_alpha;` then run focused queries like `SELECT * FROM tickets;`.
- PostgreSQL Advantage: Thousands of schemas are feasible; local constraints/indexes per tenant.
- Scalable Growth: On onboarding, create `tenant_{slug}` from `base_template` and provision `tenant_{slug}_docs`.

---

## Minimal Implementation Checklist

Global

- `tenants` table with `slug`, `stripe_account_id`, `stripe_webhook_secret`, `rag_index_namespace`.
- Tenant resolution middleware; always set/reset `search_path`.

Per-tenant lifecycle

- On signup: `CREATE SCHEMA tenant_{slug};` + `CREATE TABLE ... (LIKE base_template. ... INCLUDING ALL)`.
- Provision embeddings namespace `tenant_{slug}_docs`.

Runtime

- Stripe calls with `{ stripeAccount: tenant.stripe_account_id }`.
- Retrieval limited to `tenant.rag_index_namespace`.
- Ticket APIs operate within the current `search_path`.

---

## SQL and Operational Notes

- Validate tenant slugs with `^[a-z0-9_]+$`.
- Reset `search_path` after each request.
- Avoid cross-tenant joins; run global analytics in a separate `global` or `public` schema.
- Automate migrations by iterating schemas: `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';`.
