# Recent Changes

## 3. Shipping Company Pricing Types

Shipping companies now support two pricing models, selectable per company.

### Model

| Field | Type | Description |
|-------|------|-------------|
| `pricingType` | enum | `FIXED` or `WEIGHT_DISTANCE` (default: `FIXED`) |
| `baseCost` | Int | Flat rate cost in tomans (used when `FIXED`) |
| `pricePerKg` | Int? | Cost per kilogram in tomans (required when `WEIGHT_DISTANCE`) |
| `pricePerKm` | Int? | Cost per kilometer in tomans (required when `WEIGHT_DISTANCE`) |

### Admin create/update

```json
{
  "name": "پست جمهوری اسلامی",
  "pricingType": "FIXED",
  "baseCost": 35000,
  "estimatedDaysMin": 3,
  "estimatedDaysMax": 7,
  "isActive": true
}
```

```json
{
  "name": "تیپاکس",
  "pricingType": "WEIGHT_DISTANCE",
  "pricePerKg": 15000,
  "pricePerKm": 2000,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 2,
  "isActive": true
}
```

**Validation:** When `pricingType` is `WEIGHT_DISTANCE`, both `pricePerKg` and `pricePerKm` are required. When `FIXED`, only `baseCost` is relevant.

### Cost calculation

The `calculateShippingCost()` function is used when placing an order:

- **FIXED:** `company.baseCost`
- **WEIGHT_DISTANCE:** `(pricePerKg ?? 0) × weight + (pricePerKm ?? 0) × distance`

Weight and distance values are provided by the client during order creation (future enhancement will calculate these automatically from address + product weight via a live API).

### Response

`GET /api/v1/shipping-companies` now returns the new fields:

```json
{
  "id": 1,
  "name": "پست جمهوری اسلامی",
  "pricingType": "FIXED",
  "baseCost": 35000,
  "pricePerKg": null,
  "pricePerKm": null,
  "acceptsPrepay": true,
  "acceptsFreightCollect": true,
  ...
}
```

---

## 4. Shipping Company Payment Options

Each shipping company has two boolean flags controlling which payment methods are available:

| Field | Default | Description |
|-------|---------|-------------|
| `acceptsPrepay` | `true` | Company accepts prepayment (GATEWAY / WALLET / MIXED) |
| `acceptsFreightCollect` | `false` | Company accepts payment on delivery (FREIGHT_COLLECT / COD) |

The admin sets these when creating or updating a shipping company:

```json
{
  "name": "پست جمهوری اسلامی",
  "acceptsPrepay": true,
  "acceptsFreightCollect": true
}
```

When a customer places an order, the system validates that the chosen `paymentMethod` is compatible with the shipping company:

- `FREIGHT_COLLECT` → company must have `acceptsFreightCollect: true`
- `GATEWAY` / `WALLET` / `MIXED` → company must have `acceptsPrepay: true`

---

## 5. FREIGHT_COLLECT Payment Method (Cash on Delivery)

A new `FREIGHT_COLLECT` value has been added to the `PaymentMethod` enum.

### How it works

1. Customer selects a shipping company that has `acceptsFreightCollect: true`
2. Customer sets `paymentMethod: "FREIGHT_COLLECT"` when creating the order
3. No wallet check or gateway payment is required
4. Order status is set to `PROCESSING` immediately (no pending payment)
5. `paidAt` remains `null` (payment collected on delivery)
6. No transactions (wallet or gateway) are created

### Order creation example

```json
{
  "addressId": 1,
  "shippingCompanyId": 1,
  "paymentMethod": "FREIGHT_COLLECT",
  "discountCode": "WELCOME10"
}
```

### Validation rules

- `FREIGHT_COLLECT` does not require `gatewaySlug`
- The `createOrderSchema` refine allows omitting `gatewaySlug` for both `WALLET` and `FREIGHT_COLLECT`
- The shipping company must have `acceptsFreightCollect: true`

### API response

The order response includes `paymentMethod: "FREIGHT_COLLECT"` and `paidAt: null`:

```json
{
  "id": 1,
  "orderNumber": "ORD-1001",
  "paymentMethod": "FREIGHT_COLLECT",
  "status": "PROCESSING",
  "paidAt": null,
  "totalAmount": 485000,
  "shippingCost": 35000,
  ...
}
```

---

## 6. Wallet Withdrawal Bank Details and Tracking Code

Wallet withdrawal requests now capture the user's bank account information and expose it to admins when reviewing withdrawals.

### New fields on withdrawal requests

| Field | Type | Description |
|-------|------|-------------|
| `bankSheba` | string? | User bank IBAN/SWIFT-style account number |
| `bankCardNumber` | string? | User card number |
| `bankAccountOwnerName` | string? | Account holder full name |
| `trackingCode` | string? | Admin-entered payment tracking code shown to the user after approval |

### Request payload example

```json
{
  "amount": 250000,
  "description": "برداشت آزمایشی",
  "bankSheba": "IR820540102680020817909002",
  "bankCardNumber": "6104337000000000",
  "bankAccountOwnerName": "علی رضایی"
}
```

### Admin review payload example

```json
{
  "status": "APPROVED",
  "adminNote": "تایید شد",
  "trackingCode": "TRK-1001"
}
```

These fields are returned in wallet withdrawal records so admins can review account details and payment tracking information.

---

## 7. Order Shipping Weight and Distance

The `order` table now records the weight and distance used for shipping cost calculation:

| Field | Type | Description |
|-------|------|-------------|
| `shippingWeight` | Int? | Total order weight in grams |
| `shippingDistance` | Int? | Shipping distance in kilometers |

These are optional input fields when creating an order:

```json
{
  "addressId": 1,
  "shippingCompanyId": 1,
  "shippingWeight": 2500,
  "shippingDistance": 15,
  "paymentMethod": "GATEWAY",
  "gatewaySlug": "zarinpal"
}
```

Currently, these values are stored but not auto-calculated. A future enhancement will:
1. Read `weight` from each `ProductVariant` (to be added)
2. Calculate `distance` from the customer's address via a live shipping API
3. Call `calculateShippingCost()` automatically

---

## 8. Product Variant Pricing Fix — priceAdjustment + Attribute Modifiers Now Combined

**No schema change.** This is a bugfix in how variant prices were calculated and exposed to the
API — several places were silently ignoring the per-attribute-value price modifiers
(`modifierType`/`modifierValue` on each `ProductVariantAttributeValue`) and only used the flat
`ProductVariant.priceAdjustment` field instead. This meant setting a price modifier on a color/size
(e.g. "XL costs 20,000 Toman more") had **no effect** on the price shown in the cart or on
product listing pages, and for currency-based products it could cause the cart price and the
order price to disagree.

Both `priceAdjustment` and every attribute value's `modifierType`/`modifierValue` are now combined
in a single calculation used everywhere (cart, order price re-verification, product min/max price,
product detail API). Nothing about how you *send* data changed — the fix is entirely on read/
calculation paths. Two things changed in API **responses** that the frontend should pick up:

### 5.1. `variants[].attributeValues[]` now includes the modifier fields

Previously the product detail endpoints (`GET /api/products/:id`, `GET /api/products/slug/:slug`,
admin product endpoints) stripped `modifierType`/`modifierValue` from each attribute value before
sending it to the frontend. They are now included:

```json
{
  "variants": [
    {
      "id": 12,
      "sku": "SHIRT-XL-RED",
      "priceAdjustment": 5000,
      "stock": 8,
      "finalPrice": 125000,
      "attributeValues": [
        {
          "id": 4,
          "value": "XL",
          "colorHex": null,
          "order": 1,
          "attribute": { "id": 2, "name": "سایز", "slug": "size", "inputType": "SELECT" },
          "modifierType": "FIXED_IRT",
          "modifierValue": 20000
        }
      ]
    }
  ]
}
```

### 5.2. New `variants[].finalPrice` field

Every variant in a product detail response now includes a computed `finalPrice` (Int, Toman) —
the fully-resolved price for that exact combination (`basePrice`/`currentPriceIRT` +
`priceAdjustment` + every attribute value's modifier, converted through the product's currency
rate when relevant). **The frontend should use `finalPrice` directly to show the price for a
selected combination, instead of computing it itself** (e.g. instead of `basePrice +
priceAdjustment`, which was the old — and incorrect — approach once modifiers are involved).
Note `finalPrice` does not include the product-level discount (`discountType`/`discountValue`);
that is applied the same way as before, on top of this value.

### Nothing else in the request/response shape changed

Creating/updating variants (`POST/PUT /api/admin/products/:id/variants`) is unchanged — you already
send `modifierType`/`modifierValue` per attribute value there; that data is now actually used
everywhere it's supposed to be.

---

## 9. PERCENTAGE Modifier Now Allowed for FIXED_IRT (Rial) Products

Per product decision: a Rial-priced (`FIXED_IRT`) product can now have a variant attribute value
with `modifierType: "PERCENTAGE"` — e.g. "size XL costs 10% more than the base price." Previously
this was rejected with a 400 error; it's now calculated as `basePrice + FIXED_IRT modifiers +
basePrice × (sum of PERCENTAGE modifiers / 100)`.

No request/response shape changed — this only affects which `modifierType` values are accepted
for `FIXED_IRT` products when creating/updating a variant's attribute values, and how the final
price is computed (see section 5 above for `finalPrice`). `FIXED_SOURCE_CURRENCY` is still rejected
for `FIXED_IRT` products (a Rial product has no source currency to reference).

## 10. Duplicate Variant Combination Now Rejected at the Database Level (Schema Change)

**This requires a migration.** A new column `ProductVariant.comboKey` was added, with a unique
constraint on `(productId, comboKey)`. `comboKey` is the sorted, comma-joined list of a variant's
attribute value IDs (e.g. `"3,7"`), computed and set automatically by the backend — nothing new to
send from the frontend.

Why: the previous duplicate-combination check only happened in application code (read, then
write), so two simultaneous "add variant" requests with the same attribute combination could both
slip through and create two variants with the identical combination. The database now rejects the
second one outright (`409 Conflict` — "تنوعی با همین ترکیب ویژگی‌ها از قبل برای این محصول وجود
دارد"), the same error message as before, just now guaranteed instead of best-effort.

No API request/response shape changed. `POST/PUT /api/admin/products/:id/variants` behave exactly
as documented; the only visible difference is that the 409 conflict is now impossible to bypass
via a race condition.

---

## 11. Fixes From Frontend Audit (7 items) + One Extra Security Fix Found During Review

Per the frontend team's backend audit, the following are fixed. No response shape changed for any
of these except where noted.

**11.1 — Removing an image now actually clears it.** `mediaId` / `coverImageMediaId` /
`videoMediaId` / `logoMediaId` / `imageMediaId` now accept `null` (previously only accepted a
positive integer or being omitted — sending `null` was coerced to `0` and rejected with a 400).
Sending `null` for the mediaId field also clears the paired URL field (`imageUrl`/`logoUrl`/
`coverImageUrl`/`mediaUrl`) automatically, so the frontend doesn't need to send both.

Also found while fixing this: **`Brand`, `Category`, and `ShippingCompany` didn't have a
`logoMediaId`/`imageMediaId` field in their validation schemas at all** (not just non-nullable —
completely absent, silently stripped by Zod). Linking a logo/image from the media library to a
brand, category, or shipping company didn't work at all before this fix; only a raw `logoUrl`/
`imageUrl` string was accepted. This is now fixed the same way as the others.

**11.2 — Order return images.** `POST /orders/:id/return` now also accepts `multipart/form-data`
with up to 5 files under the field name `images`, uploaded and linked automatically (same pattern
as ticket attachments) — no need to upload to `/media` first anymore. Sending `imageMediaIds` in
a plain JSON body still works as before.

**11.3 — `PUT /api/admin/currencies/:id` now accepts `name`.**

**11.4 — `userIds` in `POST /api/admin/notifications/broadcast`** is now validated as an array of
numbers (was `string[]`, which never matched what the service expected).

**11.5 — `description` in `POST /api/admin/users/:id/wallet/adjust`** is no longer silently
dropped.

**11.6 — Comment attachments.** `attachmentMediaIds` (array of already-uploaded media IDs) is now
accepted directly in the comment JSON body — no multipart required. Multipart upload (field name
`attachments`, same as tickets) also still works and merges into the same field.

**11.7 — No backend change needed** (frontend-only OTP length issue, already resolved on that side).

### Extra fix found while implementing 11.6 (security)

Accepting `attachmentMediaIds`/`imageMediaIds` directly in a JSON body (11.2 and 11.6) opened a
gap: nothing verified that the referenced media actually belonged to the requesting user. A user
could have attached **any** existing media ID — including another user's private upload, or a
completely unrelated file — to their own comment or return request. The exact same gap already
existed in the ticket system (`POST /support/tickets`, ticket replies), which predates this audit
and wasn't part of the reported list, but shares the same root cause, so it's fixed too:
attachment/return media IDs sent directly (not via file upload) are now checked against
`Media.uploadedById` before being linked, and rejected with `400` if any ID doesn't belong to the
requesting user. This is enforced in the backend only — no frontend change needed unless your
integration relied on attaching someone else's media (it shouldn't have).

---

## 12. Redis Added to the Project (Infrastructure — No API Shape Changes)

Redis is now used across the backend as shared infrastructure. **This is a backend-only,
operational change — no frontend/API request or response shape changed.** Documented here mainly
so the frontend/ops team knows what now depends on Redis being available.

No `prisma.schema` change, no migration needed for this task.

### What uses Redis now

1. **Rate limiting** (`src/middlewares/rateLimiter.ts`) — the global API limiter and the strict
   auth limiter (login, OTP endpoints) now share their counters through Redis instead of an
   in-process `Map`. This matters if the API is ever run as more than one instance: previously each
   instance had its own counter (so the real limit was effectively `max × instance count`); now
   it's a true shared limit.
2. **Background job locking** (`src/jobs/scheduler.ts`) — each cron job (stale-order expiry, OTP
   cleanup, discount aggregate refresh, auto-close tickets, currency rate fetch) takes a Redis lock
   before running, so if the API is ever scaled to multiple instances, a job can't run twice in the
   same window.
3. **Login lockout fast-path** (`src/services/auth/login-guard.service.ts`) — the "is this account
   temporarily locked?" check now reads a Redis counter instead of a `COUNT()` query against the
   `LoginAttempt` table on every login attempt. The `LoginAttempt` table itself is untouched — every
   attempt is still recorded there for admin visibility.
4. **OTP resend cooldown fast-path** (`src/services/otp/otp.service.ts`) — same idea for "please
   wait N seconds before requesting another code."
5. **Caching** (`src/lib/cache.ts`) — a small generic cache helper, applied so far to:
   - Category tree (`GET` category endpoints) — cached 5 minutes, but invalidated immediately on
     any category create/update/delete, so admin changes show up right away regardless of the TTL.
   - Currency list (`GET /api/admin/currencies`) — cached 60 seconds, invalidated on manual rate
     edits. The scheduled rate-fetch job also invalidates it, but a 60s TTL is kept as a safety net
     since that job writes to the database directly.

### Resilience — Redis going down does not take the API down

Every one of the above has a fallback: if Redis is unreachable (or `REDIS_ENABLED=false`), rate
limiting falls back to the previous in-memory behavior, job locking just runs directly
(today's single-instance behavior), login/OTP checks fall back to their original database queries,
and caching is simply skipped (data is fetched fresh every time). Nothing throws or 500s because
Redis is missing — the app degrades gracefully to "how it worked before this change," just slower
under multi-instance/high-load conditions.

### New environment variables

```
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
```

### Next phase (not done yet — flagged for a future task, on purpose)

Caching the product listing/search endpoint (filters, pagination, price range) was intentionally
**not** done in this pass. It touches many more write paths (product create/update/delete, stock
changes, discount changes, price recalculation jobs) and getting invalidation wrong there risks
showing customers a stale price or an out-of-stock item as available — worth doing as its own
focused, carefully-reviewed task rather than folding into this one.

### Bug found and fixed: exchange-rate refresh was collapsing product price ranges

While tracing every place that writes `Currency.currentRate`, `recalculateProductsForCurrency` in
`src/services/exchangeRateFetcher.ts` was setting every affected product's `minPrice`/`maxPrice` to
the single price of its default variant — the same simplification fixed for variant-level pricing
in a previous task (see section 8), reintroduced here. In practice: every time the exchange-rate
refresh job ran (or an admin manually edited a rate), the price *range* shown for every
currency-based product with per-variant modifiers would silently collapse back to one flat number,
undoing the correct min/max tracking. Fixed by having this job reuse the same
`recomputeProductAggregates` used everywhere else, so `currentPriceIRT` (a representative
default-variant price) is still computed here directly, but `minPrice`/`maxPrice` now always
reflect every active variant's own modifiers, consistently, no matter what triggered the
recalculation. Covered by `tests/currency-recalc.test.ts`.

---

## 13. Product Listing/Search Now Cached (Phase 7 of the Redis rollout)

**No API request/response shape changed.** `GET` product listing/search (storefront only — not the
admin listing) and the filter-sidebar endpoint (brands, price range, filterable attributes) are now
cached for **30 seconds**, keyed by the exact combination of query parameters used (page, limit,
sort, category, brand, price range, search text, attribute filters, etc.) — two different filter
combinations never share a cache entry.

**Why only a short TTL, and no explicit invalidation:** this endpoint is sensitive to almost every
kind of change in the system — stock (order placed), price (variant edit or currency rate refresh),
active discounts, publish status, and more. Hunting down and invalidating on every one of those
write paths is exactly the kind of fragile, easy-to-miss-one approach flagged as a risk when this
caching phase was first proposed (see section 12). Instead, a tight 30-second TTL bounds the
worst case precisely: a shopper browsing or searching may see a product's price/stock as it was up
to 30 seconds ago. **The product detail page and the entire checkout/order path are not cached and
never were** — those always compute price and stock fresh, at the moment that actually matters
(the moment money changes hands). Covered by `tests/product-list-cache.test.ts`.

Admin product listing (`GET /api/admin/products`) is deliberately **not cached** — admins need to
see their own changes reflected immediately after saving.

---

## 14. Caching Rollout Completed Across the Rest of the Public Site

**No API request/response shape changed.** Following up on section 13, here's where caching was
and wasn't applied elsewhere, and why — this also directly addresses handling high-traffic
discount days (Black Friday-style), where most visitors are browsing rather than checking out:

### Now cached

- **Landing/homepage** (`GET /` data) — the single highest-traffic endpoint in the app (it runs
  10+ queries per request: banners, popups, stories, categories, blog, brands, and four separate
  product lists). Cached **30 seconds**, no explicit invalidation (same reasoning as product
  listing — too many independent write sources to track safely).
- **Product detail page** (`GET /products/:slug`, `GET /products/:id`) — cached **15 seconds**.
  This is the key addition for discount-day traffic: when a big sale is on, most concurrent traffic
  *is* people opening product pages to look at the discounted price, not just the listing page.
  15s (shorter than the 30s listing/landing TTL, since this page shows the exact price/stock) turns
  an unbounded flood of identical requests into at most one database read every 15 seconds per
  product — no matter how many thousands of people are looking at it at once. **View count and
  per-user wishlist status are deliberately kept outside the cache** so they stay accurate on every
  request even when the underlying product data is served from cache.
- **Blog posts & categories** (list + single) — cached, invalidated immediately on any admin
  create/update/delete.
- **Brands** (list + single) — same, invalidated on write.
- **Public site settings** (`getPublicSettings`) — same, invalidated on write.
- **Active stories** (homepage story carousel) — invalidated on write, *plus* a 60s TTL safety net,
  since the set of "active" stories also changes on its own over time as stories expire
  (`expiresAt`), not just when an admin edits something.

### Deliberately NOT cached (with reasoning)

- **Comments** (`listApprovedComments`) — the response is personalized per request (whether *the
  current logged-in user* liked each comment), so a shared cache would either leak one user's like
  state to another or need a cache key per user × per product × per page, which defeats most of the
  benefit. Also, admins expect a newly-approved comment to appear immediately.
- **Addresses** (`listAddresses`) — private per-user data (PII), already a cheap indexed lookup,
  low read volume. Caching PII in Redis for negligible performance gain isn't worth the added
  privacy surface.
- **Media library search/list** (admin) — admins need to see a file they just uploaded immediately;
  this is an internal tool, not public-facing, so it doesn't get the traffic that would justify the
  staleness risk.
- **User management, sessions, admin listings in general** (users, admin product/blog/comment
  lists, etc.) — security/moderation-sensitive and admin-only; correctness and immediacy matter far
  more than shaving off a query, and traffic here is inherently low (only staff use these).
- **Global/quick search** (free-text search-as-you-type) — query strings are almost never repeated
  identically across users, so a cache would almost always miss; not worth the complexity.
- **Checkout / cart / order path** — never cached, and this was true before this task too. No
  matter how much traffic the storefront gets, the actual price/stock check at checkout is always
  computed fresh, straight from the database, at the exact moment it matters.

### On handling a real Black-Friday-style traffic spike specifically

Putting it together, here's the actual plan for a high-traffic discount day:

1. **Caching (this section) absorbs the "browsing" load** — homepage and product-detail pages,
   which is where the bulk of traffic goes when people are reviewing a sale, now cost the database
   roughly the same regardless of whether 100 or 100,000 people are looking, because of the TTL
   caching above.
2. **The app is now safe to run on more than one instance** (see section 12) — rate limiting and
   job locking are already Redis-backed, so if you need to handle a traffic spike by scaling
   horizontally (more Node processes behind a load balancer), nothing here breaks or duplicates.
   This was one of the main reasons for building the Redis infrastructure this way.
3. **Checkout stays accurate under load** — because it was never cached, a customer never gets
   charged based on stale price/stock data, no matter how cache-heavy the browsing experience gets.
4. **Not addressed here, worth a future look if you expect flash-sale-style limited stock:** if a
   sale item has very limited stock and many customers race to buy it at the same moment, the
   current stock check at order time (a normal database read/write) can still be a point of
   contention under extreme concurrency. If you expect that specific scenario, a Redis-backed
   atomic stock reservation (similar to how the rate limiter's Lua script works) would be the next
   thing worth building — flagged here, not implemented, since it changes order-creation behavior
   and deserves its own dedicated pass.

Covered by `tests/product-detail-cache.test.ts` and `tests/misc-cache.test.ts`.
