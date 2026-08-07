import { runKeywordLayer } from "../src/engine/layer1-keywords";
import { IncomingMessage, ConversationContext } from "../src/engine/types";
import { makeFakeLookup, fakeSearchLookup, makeProduct } from "./fakeLookup";

function msg(text: string, overrides: Partial<IncomingMessage> = {}): IncomingMessage {
  return { channel: "WEBSITE", externalCustomerId: "guest-1", text, ...overrides };
}

const EMPTY_CONTEXT: ConversationContext = {};

describe("layer1: conversation memory — pending action (AWAITING_OPTION_SELECTION)", () => {
  it("وقتی چند گزینه ارائه می‌شود، pendingAction را با شناسه‌ی گزینه‌ها ثبت می‌کند", async () => {
    const productA = makeProduct({ id: 1, name: "کراپ مشکی" });
    const productB = makeProduct({ id: 2, name: "کراپ سفید" });
    const lookup = fakeSearchLookup([], [productA, productB]);

    const reply = await runKeywordLayer(lookup, msg("کراپ دارید؟ قیمتش چنده"), EMPTY_CONTEXT);

    expect(reply).not.toBeNull();
    expect(reply!.metadata?.pendingAction).toEqual({
      type: "AWAITING_OPTION_SELECTION",
      intent: "PRICE",
      candidateProductIds: [1, 2],
    });
  });

  it("پیام بعدی «۲» را به‌عنوان انتخاب گزینه‌ی دوم تفسیر می‌کند و همان intent اصلی را جواب می‌دهد", async () => {
    const productA = makeProduct({ id: 1, name: "کراپ مشکی", minPrice: 100000, maxPrice: 100000 });
    const productB = makeProduct({ id: 2, name: "کراپ سفید", minPrice: 200000, maxPrice: 200000 });
    const lookup = makeFakeLookup([productA, productB]);

    const context: ConversationContext = {
      pendingAction: { type: "AWAITING_OPTION_SELECTION", intent: "PRICE", candidateProductIds: [1, 2] },
    };

    // پیام مشتری اینجا هیچ کلمه‌ی رزرو شده‌ای ندارد — فقط «۲» است، دقیقاً
    // همان سناریویی که قبلاً موتور اشتباه به‌عنوان یک پیام تازه می‌فهمید
    const reply = await runKeywordLayer(lookup, msg("۲"), context);

    expect(reply).not.toBeNull();
    expect(reply!.text).toContain("کراپ سفید");
    expect(reply!.text).toContain("تومان");
    expect(reply!.metadata?.matchedBy).toBe("pendingOptionSelection");
  });

  it("کلمه‌ی ترتیبی فارسی («دومی») را هم می‌فهمد", async () => {
    const productA = makeProduct({ id: 1, name: "کراپ مشکی" });
    const productB = makeProduct({ id: 2, name: "کراپ سفید" });
    const lookup = makeFakeLookup([productA, productB]);

    const context: ConversationContext = {
      pendingAction: { type: "AWAITING_OPTION_SELECTION", intent: "STOCK", candidateProductIds: [1, 2] },
    };

    const reply = await runKeywordLayer(lookup, msg("دومی رو میخوام"), context);

    expect(reply!.text).toContain("کراپ سفید");
  });

  it("اگر پیام اصلاً شبیه انتخاب نبود، pendingAction را نادیده می‌گیرد و روال عادی را ادامه می‌دهد", async () => {
    const productA = makeProduct({ id: 1, name: "کراپ مشکی" });
    const lookup = makeFakeLookup([productA]);

    const context: ConversationContext = {
      pendingAction: { type: "AWAITING_OPTION_SELECTION", intent: "PRICE", candidateProductIds: [1] },
    };

    // موضوع را کامل عوض کرده — سوال درباره‌ی ارسال، نه انتخاب گزینه
    const reply = await runKeywordLayer(lookup, msg("هزینه ارسال چقدره؟"), context);

    expect(reply!.metadata?.matchedBy).not.toBe("pendingOptionSelection");
  });
});

describe("layer1: conversation memory — pending action (AWAITING_PRODUCT_CODE)", () => {
  it("وقتی محصولی پیدا نشد، pendingAction از نوع AWAITING_PRODUCT_CODE ثبت می‌شود", async () => {
    const lookup = fakeSearchLookup([], []);
    const reply = await runKeywordLayer(lookup, msg("قیمت این چنده؟"), EMPTY_CONTEXT);

    expect(reply!.metadata?.pendingAction).toEqual({ type: "AWAITING_PRODUCT_CODE", intent: "PRICE" });
  });

  it("پیام بعدی که فقط خودِ کد است (حتی کوتاه) را به‌عنوان پاسخ به سوال قبلی می‌فهمد", async () => {
    const product = makeProduct({ id: 5, shortCode: "AB", name: "شلوار جین" });
    const lookup = makeFakeLookup([product]);

    const context: ConversationContext = {
      pendingAction: { type: "AWAITING_PRODUCT_CODE", intent: "STOCK" },
    };

    const reply = await runKeywordLayer(lookup, msg("AB"), context);

    expect(reply!.text).toContain("شلوار جین");
    expect(reply!.metadata?.matchedBy).toBe("pendingCode");
  });
});

describe("layer1: conversation memory — carryover (lastProductId)", () => {
  it("بدون تکرار کد، سوال بعدی را درباره‌ی آخرین محصول شناسایی‌شده جواب می‌دهد", async () => {
    const product = makeProduct({ id: 7, name: "کفش ورزشی", isInStock: true });
    const lookup = makeFakeLookup([product]);

    const context: ConversationContext = { lastProductId: 7 };

    // «رنگاش چی داره؟» — بدون کد، بدون نام محصول
    const reply = await runKeywordLayer(lookup, msg("موجوده؟"), context);

    expect(reply!.text).toContain("کفش ورزشی");
    expect(reply!.metadata?.matchedBy).toBe("contextCarryover");
  });

  it("اگر پیام جدید کد صریح داشته باشد، آن را به carryover ترجیح می‌دهد", async () => {
    const oldProduct = makeProduct({ id: 7, name: "کفش قدیمی", shortCode: "OLD1" });
    const newProduct = makeProduct({ id: 9, name: "کفش جدید", shortCode: "NEW1" });
    const lookup = makeFakeLookup([oldProduct, newProduct]);

    const context: ConversationContext = { lastProductId: 7 };

    const reply = await runKeywordLayer(lookup, msg("قیمت NEW1 چنده؟"), context);

    expect(reply!.text).toContain("کفش جدید");
    expect(reply!.metadata?.matchedBy).toBe("shortCode");
  });
});

describe("layer1: channel-aware phrasing", () => {
  it("ویجت سایت اشاره‌ای به کد زیر بیوگرافی یا فوروارد پست نمی‌کند", async () => {
    const lookup = fakeSearchLookup([], []);
    const reply = await runKeywordLayer(lookup, msg("قیمتش چنده", { channel: "WEBSITE" }), EMPTY_CONTEXT);

    expect(reply!.text).not.toContain("بیوگرافی");
    expect(reply!.text).not.toContain("فوروارد");
  });

  it("کانال‌های اجتماعی هنوز به کد/فوروارد اشاره می‌کنند", async () => {
    const lookup = fakeSearchLookup([], []);
    const reply = await runKeywordLayer(lookup, msg("قیمتش چنده", { channel: "TELEGRAM" }), EMPTY_CONTEXT);

    expect(reply!.text).toContain("کد محصول");
  });
});
