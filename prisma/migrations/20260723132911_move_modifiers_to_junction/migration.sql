-- Drop modifier columns from AttributeValue
ALTER TABLE "AttributeValue" DROP COLUMN IF EXISTS "modifierType";
ALTER TABLE "AttributeValue" DROP COLUMN IF EXISTS "modifierValue";

-- Add modifier columns to ProductVariantAttributeValue
ALTER TABLE "ProductVariantAttributeValue" ADD COLUMN "modifierType" "ModifierType";
ALTER TABLE "ProductVariantAttributeValue" ADD COLUMN "modifierValue" DOUBLE PRECISION;