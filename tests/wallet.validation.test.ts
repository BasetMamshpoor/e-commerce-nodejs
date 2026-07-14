import { withdrawalRequestSchema, adminReviewWithdrawalSchema } from "../src/validations/wallet.validation";

describe("wallet validation", () => {
  it("فیلدهای اطلاعات بانکی را در درخواست برداشت نگه می‌دارد", () => {
    const parsed = withdrawalRequestSchema.safeParse({
      amount: 250000,
      description: "برداشت آزمایشی",
      bankAccountOwnerName: "علی رضایی",
      bankCardNumber: "6104337000000000",
      bankSheba: "IR820540102680020817909002",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data).toMatchObject({
      amount: 250000,
      bankAccountOwnerName: "علی رضایی",
      bankCardNumber: "6104337000000000",
      bankSheba: "IR820540102680020817909002",
    });
  });

  it("فیلد کد رهگیری را در تایید درخواست برداشت نگه می‌دارد", () => {
    const parsed = adminReviewWithdrawalSchema.safeParse({
      status: "APPROVED",
      adminNote: "تایید شد",
      trackingCode: "TRK-1001",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data).toMatchObject({ trackingCode: "TRK-1001" });
  });
});
