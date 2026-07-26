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
