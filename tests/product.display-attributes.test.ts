import { prisma } from "../src/lib/prisma";
import { updateProduct } from "../src/services/catalog/product.service";

describe("product display attributes", () => {
  let productId: number;
  let attributeId: number;
  let attributeValueId: number;

  beforeAll(async () => {
    const attribute = await prisma.attribute.create({
      data: {
        name: "Test Attribute",
        slug: `test-attribute-${Date.now()}`,
        inputType: "TEXT",
        isFilterable: true,
        isVariant: false,
        isDisplay: true,
      },
    });

    const attributeValue = await prisma.attributeValue.create({
      data: {
        attributeId: attribute.id,
        value: "Test Value",
        order: 0,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        slug: `test-product-${Date.now()}`,
        basePrice: 100000,
        status: "DRAFT",
      },
    });

    productId = product.id;
    attributeId = attribute.id;
    attributeValueId = attributeValue.id;
  });

  afterAll(async () => {
    await prisma.productDisplayAttributeValue.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.attributeValue.delete({ where: { id: attributeValueId } });
    await prisma.attribute.delete({ where: { id: attributeId } });
  });

  it("در ویرایش محصول، displayAttributes در دیتابیس ذخیره می‌شود", async () => {
    await updateProduct(productId, {
      displayAttributes: [{ attributeId, value: "Updated display value" }],
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { displayAttributeValues: true },
    });

    expect(updatedProduct?.displayAttributeValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributeId,
          value: "Updated display value",
        }),
      ])
    );
  });
});
