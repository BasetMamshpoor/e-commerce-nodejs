# Dynamic Currency-Based Pricing

> Products can be priced in foreign currencies with auto-updating exchange rates.
> Exchange rates are fetched from BRS API (primary) and Navasan API (fallback),
> then prices are recalculated in Toman via a background job.

> **⚠️ All prices displayed to users — customers and administrators — must be shown in Tomans.**
> The `sourcePrice` and `currency.symbol` fields exist for internal reference only.
> Frontend must always use `currentPriceIRT` (for CURRENCY_BASED products) or `basePrice` (for FIXED_IRT)
> when displaying prices to users. Never display the source currency amount as a price.

---

## Table of Contents

1. [Model Changes](#1-model-changes)
2. [Price Calculation](#2-price-calculation)
3. [New Admin APIs](#3-new-admin-apis)
4. [New Public APIs](#4-new-public-apis)
5. [Product API Changes](#5-product-api-changes)
6. [Attribute Value API Changes](#6-attribute-value-api-changes)
7. [Cart API Changes](#7-cart-api-changes)
8. [Order API Changes](#8-order-api-changes)
9. [Frontend Guide](#9-frontend-guide)

---

## 1. Model Changes

### Product

| Field | Type | Description |
|-------|------|-------------|
| `pricingMode` | enum (`FIXED_IRT` / `CURRENCY_BASED`) | Pricing mode; default `FIXED_IRT` |
| `currencyId` | String? | FK to Currency; required when `CURRENCY_BASED` |
| `sourcePrice` | Float? | Price in source currency (e.g. 10 for USD) |
| `priceBufferPercent` | Int | Buffer percentage for rate fluctuation; default 0 |
| `currentPriceIRT` | Int | Current price in Toman, auto-updated by the background job |
| `priceUpdatedAt` | DateTime? | Last time the price was auto-updated |

**Note:** `currentPriceIRT` is stored as Int (Toman) and is used as the base for `CURRENCY_BASED` products in cart/order calculations.

### ProductVariantAttributeValue (junction table)

| Field | Type | Description |
|-------|------|-------------|
| `modifierType` | enum? (`PERCENTAGE` / `FIXED_SOURCE_CURRENCY` / `FIXED_IRT`) | Type of price modifier; `null` = no price impact |
| `modifierValue` | Float? | Modifier value; `null` when no modifier |

Modifier types:
- **`null` / omitted:** No price impact (default)
- **`PERCENTAGE`:** Percentage increase/decrease (e.g. `-10` = 10% off, `10` = 10% surcharge); applied on `sourcePrice` for `CURRENCY_BASED` products
- **`FIXED_SOURCE_CURRENCY`:** Fixed amount in source currency (e.g. `5` = $5); only applied for `CURRENCY_BASED` products
- **`FIXED_IRT`:** Fixed amount in Toman (e.g. `50000` = 50,000 Toman); applied post-conversion

**Important:** Modifiers are per-product, not per-attribute-value. The same attribute value (e.g. "Silver") can have different modifiers for different products. They are set on the junction table between a variant and its attribute value.

### OrderItem

| Field | Type | Description |
|-------|------|-------------|
| `finalPriceIRT` | Int | Final unit price in Toman at time of order (renamed from `price`) |
| `pricingModeSnapshot` | String | `FIXED_IRT` or `CURRENCY_BASED` as recorded at order time |
| `sourceCurrencyCode` | String? | Source currency code (e.g. "USD") |
| `appliedRate` | Float? | Exchange rate applied at order time |

### Currency (new model)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | cuid, auto-generated |
| `code` | String (unique) | Currency code (e.g. USD, EUR, AED) |
| `name` | String | Display name (e.g. "US Dollar") |
| `symbol` | String? | Currency symbol (e.g. $, €) |
| `isActive` | Boolean | Whether the currency is active for rate fetching |
| `currentRate` | Float? | Most recent exchange rate |
| `lastFetchedAt` | DateTime? | When rates were last fetched |
| `lastAppliedRate` | Float? | Last rate that was applied to products |
| `lastAppliedAt` | DateTime? | When the rate was last applied |
| `createdAt` | DateTime | auto-set |
| `updatedAt` | DateTime | auto-set |

### ExchangeRateHistory (new model)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | cuid, auto-generated |
| `currencyId` | String | FK to Currency |
| `rate` | Float | The recorded rate |
| `source` | String | Provider name (`brsapi`, `navasan`, or `manual`) |
| `wasApplied` | Boolean | Whether the rate triggered a product price update |
| `changePercent` | Float? | Percent change from previous applied rate |
| `fetchedAt` | DateTime | Timestamp |

---

## 2. Price Calculation

The `calculateFinalPrice` function in `src/services/pricingEngine.ts` is a pure function with no side effects.

### FIXED_IRT

```
base = product.basePrice
price = base
  + Σ(attributeModifiers where type = FIXED_IRT)
  + base × Σ(attributeModifiers where type = PERCENTAGE)
finalPrice = price × (1 - discountPercentage) - discountFixedValue
```

### CURRENCY_BASED

```
base = product.currentPriceIRT × (1 + product.priceBufferPercent / 100)
attributeCost =
    Σ(attributeModifiers where type = FIXED_IRT)
  + base × Σ(attributeModifiers where type = PERCENTAGE)
  + Σ(attributeModifiers where type = FIXED_SOURCE_CURRENCY × currentRate)
price = base + attributeCost
finalPrice = price × (1 - discountPercentage) - discountFixedValue
```

Key points:
- `currentPriceIRT` is auto-calculated when the background job runs
- `FIXED_SOURCE_CURRENCY` modifiers are **ignored** for `FIXED_IRT` products
- The function does not use `minPrice`/`maxPrice` from the product (those are for display/filtering only)
- The price breakdown is returned as a typed `PriceBreakdown` object

### PriceBreakdown type

```typescript
interface PriceBreakdown {
  basePrice: number;
  attributeCost: number;
  attributeCostBreakdown: Array<{
    attributeValueId: number;
    modifierType: string | null;
    modifierValue: number | null;
    cost: number;
  }>;
  discountAmount: number;
  discountType: string | null;
  discountValue: number | null;
  finalPrice: number;
  pricingMode: 'FIXED_IRT' | 'CURRENCY_BASED';
  appliedRate?: number;
}
```

---

## 3. New Admin APIs

### GET /api/admin/currencies

List all currencies:

```json
[
  {
    "id": "cmr...",
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "isActive": true,
    "currentRate": 192405,
    "lastFetchedAt": "2026-07-22T20:08:00.000Z",
    "lastAppliedRate": 192000,
    "lastAppliedAt": "2026-07-22T20:08:00.000Z"
  }
]
```

### POST /api/admin/currencies

Create a new currency:

```json
{
  "code": "GBP",
  "name": "British Pound",
  "symbol": "£",
  "isActive": true
}
```

### PATCH /api/admin/currencies/:id

Update a currency or manually override its rate:

```json
{
  "name": "US Dollar",
  "isActive": true,
  "manualRate": 195000
}
```

- If `manualRate` is provided, a rate history entry with `source: "manual"` is created and all products using this currency are immediately recalculated
- If `manualRate` is omitted, only the currency metadata is updated

### POST /api/admin/products/preview-price

Preview the final price of a product without saving. Accepts modifiers directly (no DB lookup):

```json
{
  "pricingMode": "CURRENCY_BASED",
  "sourcePrice": 10,
  "priceBufferPercent": 2,
  "modifiers": [
    { "modifierType": "PERCENTAGE", "modifierValue": 10 },
    { "modifierType": "FIXED_IRT", "modifierValue": 50000 }
  ]
}
```

Response:

```json
{
  "finalPriceIRT": 1100000,
  "sourceAmount": 11,
  "rateUsed": 0,
  "bufferApplied": null,
  "fixedIrtAdjustments": 50000,
  "totalAdjustments": 1
}
```

---

## 4. New Public APIs

### GET /api/currencies

List active currencies (for frontend display):

```json
[
  {
    "id": "cmr...",
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "currentRate": 192405
  }
]
```

---

## 5. Product API Changes

### POST /api/admin/products

Create a product with currency-based pricing:

```json
{
  "title": "MacBook Pro",
  "pricingMode": "CURRENCY_BASED",
  "currencyId": "cmr...",
  "sourcePrice": 999.99,
  "priceBufferPercent": 2,
  "basePrice": 0,
  "minPrice": 19000000,
  "maxPrice": 20000000,
  "categoryId": 1,
  "brandId": 1,
  "variants": [
    {
      "sku": "MAC-SILVER",
      "priceAdjustment": 0,
      "stock": 10,
      "attributeValues": [
        { "attributeValueId": 1, "modifierType": "FIXED_IRT", "modifierValue": 50000 },
        { "attributeValueId": 2 }
      ]
    }
  ]
}
```

**Modified `attributeValues` field in variants:**
- Previously: `"attributeValueIds": [1, 2]` (plain array of IDs)
- Now: `"attributeValues": [{"attributeValueId": 1, "modifierType": "FIXED_IRT", "modifierValue": 50000}, ...]`
- `modifierType` and `modifierValue` are optional; omit or set to `null` for no price impact

**Validation rules:**
- If `pricingMode = CURRENCY_BASED`: `currencyId` and `sourcePrice` are required
- If `pricingMode = FIXED_IRT`: `basePrice` is required (>= 1000)
- `sourcePrice` must be > 0
- `priceBufferPercent` must be between 0 and 100

### PUT /api/admin/products/:id

Update a product — `pricingMode` cannot be changed after creation. All other fields are updatable.

### GET /api/admin/products

Product list now returns pricing fields:

```json
{
  "id": 1,
  "title": "MacBook Pro",
  "pricingMode": "CURRENCY_BASED",
  "currency": { "id": "cmr...", "code": "USD", "symbol": "$" },
  "sourcePrice": 999.99,
  "priceBufferPercent": 2,
  "currentPriceIRT": 192000000,
  "priceUpdatedAt": "2026-07-22T20:08:00.000Z",
  "basePrice": 0,
  "minPrice": 19000000,
  "maxPrice": 20000000
}
```

### GET /api/products (public)

Public product endpoints also return pricing fields. **Frontend must use only `currentPriceIRT` for price display; `sourcePrice` and `currency` are for admin reference only and must NOT be shown to customers.**

```json
{
  "id": 1,
  "title": "MacBook Pro",
  "pricingMode": "CURRENCY_BASED",
  "currency": { "code": "USD", "symbol": "$" },
  "sourcePrice": 999.99,
  "currentPriceIRT": 192000000,
  "priceBufferPercent": 2
}
```

**Display rule:**
- `pricingMode === "CURRENCY_BASED"` → use `currentPriceIRT`
- `pricingMode === "FIXED_IRT"` → use `basePrice`

---

## 6. Attribute Value API Changes

### POST /api/admin/attributes/:id/values

Create an attribute value (modifiers are NOT set here — they are per-product):

```json
{
  "value": "Silver",
  "colorHex": "#C0C0C0"
}
```

Modifiers are set at the **product variant level** (see [Product API Changes](#5-product-api-changes)).

### PUT /api/admin/attributes/:id/values/:valueId

Update an attribute value (no modifier fields).

---

## 7. Cart API Changes

The cart API endpoints remain unchanged. Internal logic:

- For `CURRENCY_BASED` products, `currentPriceIRT` is used instead of `basePrice`
- The `calculateFinalPrice` function computes the unit price for each cart item
- The response fields (`price`, `totalPrice`) remain the same

---

## 8. Order API Changes

### POST /api/orders

No input changes. Internal logic:

1. Prices are re-verified before finalizing the order
2. If any item's price changed by more than `PRICE_CHANGE_THRESHOLD_PERCENT` (default: 5%), a `PRICE_CHANGED` error is returned
3. On success, `OrderItem` records include snapshots:

| Field | Example |
|-------|---------|
| `finalPriceIRT` | 1950000 |
| `pricingModeSnapshot` | "CURRENCY_BASED" |
| `sourceCurrencyCode` | "USD" |
| `appliedRate` | 192405 |

Error response when prices change:

```json
{
  "success": false,
  "message": "Prices have changed for some products",
  "errors": [
    {
      "field": "items",
      "message": "Product MacBook Pro price changed from 19000000 to 19500000",
      "priceChanged": true,
      "oldPrice": 19000000,
      "newPrice": 19500000
    }
  ]
}
```

---

## 9. Frontend Guide

### Displaying Product Price

**All prices must be displayed in Tomans only.** The `sourcePrice` and `currency.symbol` are for internal reference and must NOT be shown to users.

```tsx
// pages/product/[id].tsx

interface Product {
  pricingMode: 'FIXED_IRT' | 'CURRENCY_BASED';
  currentPriceIRT?: number; // Use this for CURRENCY_BASED
  basePrice: number;        // Use this for FIXED_IRT
  priceBufferPercent: number;
}

function ProductPrice({ product }: { product: Product }) {
  const price = product.pricingMode === 'CURRENCY_BASED'
    ? product.currentPriceIRT
    : product.basePrice;

  return <span>{price?.toLocaleString()} Toman</span>;
}
```

### Product Create/Edit Form

**Pricing mode selector:**

```tsx
<select name="pricingMode" onChange={handleModeChange}>
  <option value="FIXED_IRT">Fixed Price (Toman)</option>
  <option value="CURRENCY_BASED">Currency-Based Price</option>
</select>
```

**Conditional fields (CURRENCY_BASED):**

```tsx
{pricingMode === 'CURRENCY_BASED' && (
  <>
    <select name="currencyId">
      {currencies.map(c => (
        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
      ))}
    </select>
    <input name="sourcePrice" type="number" step="0.01" placeholder="Price in source currency" />
    <input name="priceBufferPercent" type="number" placeholder="Price buffer percentage" />
  </>
)}
```

**Conditional field (FIXED_IRT):**

```tsx
{pricingMode === 'FIXED_IRT' && (
  <input name="basePrice" type="number" placeholder="Base price in Toman" />
)}
```

**Variant attribute values with modifiers (new format):**

```tsx
// Each variant now sends attributeValues array (not attributeValueIds)
const variantPayload = {
  sku: "MAC-SILVER",
  priceAdjustment: 0,
  stock: 10,
  attributeValues: [
    { attributeValueId: 1, modifierType: "FIXED_IRT", modifierValue: 50000 },
    { attributeValueId: 2 },  // no price impact
  ],
};

// Build the payload:
function buildVariantPayload(variants) {
  return variants.map(v => ({
    ...v,
    attributeValues: v.attributeValues.map(av => ({
      attributeValueId: av.attributeValueId,
      ...(av.modifierType ? { modifierType: av.modifierType, modifierValue: av.modifierValue } : {}),
    })),
  }));
}
```

### Currency Symbol Display (Admin Reference Only)

These are internal reference symbols and must NOT be shown to customers. The admin panel may display them for identification purposes.

| Code | Symbol | Name |
|------|--------|------|
| USD | $ | US Dollar |
| EUR | € | Euro |
| AED | د.إ | UAE Dirham |
| CNY | ¥ | Chinese Yuan |
| TRY | ₺ | Turkish Lira |
| IQD | د.ع | Iraqi Dinar |

### Price Buffer Display

- `priceBufferPercent` indicates the allowed price fluctuation range
- Display a price range to the user:
  - Min: `currentPriceIRT`
  - Max: `currentPriceIRT × (1 + priceBufferPercent / 100)`

### Variant Attribute Value Modifier Form

Modifiers are set per variant attribute value, not on the attribute value itself:

```tsx
{/* For each variant, render attribute value rows with optional modifiers */}
{variant.attributeValues.map((av, idx) => (
  <div key={idx}>
    <select
      value={av.attributeValueId}
      onChange={(e) => updateAttributeValue(variantIdx, idx, 'attributeValueId', e.target.value)}
    >
      {attributeValues.map(avOpt => (
        <option key={avOpt.id} value={avOpt.id}>{avOpt.value}</option>
      ))}
    </select>
    <select
      value={av.modifierType ?? ''}
      onChange={(e) => updateAttributeValue(variantIdx, idx, 'modifierType', e.target.value || null)}
    >
      <option value="">No price impact</option>
      <option value="PERCENTAGE">Percentage</option>
      <option value="FIXED_SOURCE_CURRENCY">Fixed (source currency)</option>
      <option value="FIXED_IRT">Fixed (Toman)</option>
    </select>
    {av.modifierType && (
      <input
        value={av.modifierValue ?? ''}
        type="number"
        step={av.modifierType === 'PERCENTAGE' ? '1' : '1000'}
        placeholder={
          av.modifierType === 'PERCENTAGE' ? 'Percent (e.g. -10 for 10% off)' :
          av.modifierType === 'FIXED_SOURCE_CURRENCY' ? 'Amount in source currency' :
          'Amount in Toman'
        }
        onChange={(e) => updateAttributeValue(variantIdx, idx, 'modifierValue', Number(e.target.value))}
      />
    )}
  </div>
))}
```

**Important:** The same attribute value (e.g. color "Silver") can have different price modifiers for different products. For example, "Silver" adds 50,000 Toman for a laptop but 5% for a phone.

### Handling Price Change Errors at Checkout

```tsx
async function handleCheckout() {
  try {
    const order = await createOrder(payload);
    // success
  } catch (error: any) {
    if (error.errors?.some((e: any) => e.priceChanged)) {
      // Notify the user about price changes
      const refreshedCart = await getCart();
      setCart(refreshedCart);
      showToast('Some product prices have changed. Please review before ordering.');
    }
  }
}
```

### Fetching Currencies for Forms

```tsx
const { data: currencies } = await api.get('/api/currencies');
// [{ id: "cmr...", code: "USD", name: "US Dollar", symbol: "$", currentRate: 192405 }]
```

### API Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/currencies` | List active currencies (public) |
| GET | `/api/admin/currencies` | List all currencies (admin) |
| POST | `/api/admin/currencies` | Create a currency (admin) |
| PATCH | `/api/admin/currencies/:id` | Update currency or override rate (admin) |
| POST | `/api/admin/products/preview-price` | Preview final price without saving (admin) |

### Environment Variables (for deployment)

| Variable | Default | Description |
|----------|---------|-------------|
| `BRSAPI_KEY` | — | BRS API key (primary rate provider) |
| `NAVASAN_API_KEY` | — | Navasan API key (fallback rate provider) |
| `RATE_FETCH_INTERVAL_HOURS` | 4 | How often to fetch exchange rates |
| `CURRENCY_UPDATE_THRESHOLD_PERCENT` | 0.5 | Minimum rate change % to trigger product price recalculation |
| `FORCE_SYNC_INTERVAL_HOURS` | 24 | Maximum hours before forcing a full sync |
| `PRICE_CHANGE_THRESHOLD_PERCENT` | 5 | Max price change % allowed before blocking order at checkout |

---

**Last updated: July 23, 2026** — Dynamic currency-based pricing system documentation.
