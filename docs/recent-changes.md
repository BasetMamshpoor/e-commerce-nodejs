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
