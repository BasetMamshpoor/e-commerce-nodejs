import { PricingMode, ModifierType } from "../generated/prisma";

export interface AttributeValueModifier {
  modifierType: ModifierType | null;
  modifierValue: number | null;
}

export interface ProductPricingInput {
  pricingMode: PricingMode;
  basePrice: number;
  sourcePrice: number | null;
  priceBufferPercent: number | null;
}

export interface CurrencyRateInput {
  currentRate: number | null;
}

export interface PriceBreakdown {
  finalPriceIRT: number;
  sourceAmount: number;
  rateUsed: number | null;
  bufferApplied: number | null;
  fixedIrtAdjustments: number;
  totalAdjustments: number;
}

export function calculateFinalPrice(
  product: ProductPricingInput,
  currency: CurrencyRateInput | null,
  attributeModifiers: AttributeValueModifier[]
): PriceBreakdown {
  if (product.pricingMode === "FIXED_IRT") {
    let finalPrice = product.basePrice;
    let fixedIrtAdjustments = 0;

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "FIXED_IRT") {
        const val = mod.modifierValue ?? 0;
        finalPrice += val;
        fixedIrtAdjustments += val;
      } else {
        throw new Error(`Invalid modifier type ${mod.modifierType} for FIXED_IRT product`);
      }
    }

    return {
      finalPriceIRT: Math.round(finalPrice),
      sourceAmount: product.basePrice,
      rateUsed: null,
      bufferApplied: null,
      fixedIrtAdjustments,
      totalAdjustments: fixedIrtAdjustments,
    };
  }

  if (product.pricingMode === "CURRENCY_BASED") {
    let sourceAmount = product.sourcePrice ?? 0;
    let fixedIrtAdjustments = 0;

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "PERCENTAGE") {
        const base = product.sourcePrice ?? 0;
        sourceAmount += base * ((mod.modifierValue ?? 0) / 100);
      } else if (mod.modifierType === "FIXED_SOURCE_CURRENCY") {
        sourceAmount += mod.modifierValue ?? 0;
      }
    }

    const rate = currency?.currentRate ?? 0;
    let convertedIRT = sourceAmount * rate;

    let bufferApplied: number | null = null;
    if (product.priceBufferPercent) {
      const bufferAmount = convertedIRT * (product.priceBufferPercent / 100);
      convertedIRT += bufferAmount;
      bufferApplied = product.priceBufferPercent;
    }

    const totalAdjustments = sourceAmount - (product.sourcePrice ?? 0);

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "FIXED_IRT") {
        const val = mod.modifierValue ?? 0;
        convertedIRT += val;
        fixedIrtAdjustments += val;
      }
    }

    return {
      finalPriceIRT: Math.round(convertedIRT),
      sourceAmount,
      rateUsed: rate,
      bufferApplied,
      fixedIrtAdjustments,
      totalAdjustments,
    };
  }

  throw new Error(`Unknown pricing mode: ${product.pricingMode}`);
}
