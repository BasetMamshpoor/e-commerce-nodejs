import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("سبد خرید / علاقه‌مندی / مقایسه — روتینگ", () => {
  it("GET /cart برای مهمان بدون توکن باید سبد خالی + یک guestToken تازه برگرداند", async () => {
    const res = await request(app).get("/api/v1/cart");
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
    expect(typeof res.body.data.guestToken).toBe("string");
  });

  it("GET /cart با X-Guest-Token موجود، دیگر guestToken تازه برنمی‌گرداند", async () => {
    const res = await request(app).get("/api/v1/cart").set("X-Guest-Token", "abc-123");
    expect(res.status).toBe(200);
    expect(res.body.data.guestToken).toBeUndefined();
  });

  it("افزودن به سبد با variantId نامعتبر باید 400 (خطای اعتبارسنجی) بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("X-Guest-Token", "test-guest")
      .send({ variantId: "does-not-exist", quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("POST /cart/merge بدون توکن (لاگین) باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/cart/merge").send({ guestToken: "abc" });
    expect(res.status).toBe(401);
  });

  it("GET /wishlist بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/wishlist");
    expect(res.status).toBe(401);
  });

  it("GET /comparison برای مهمان بدون توکن باید 400 بدهد چون productIds الزامی است", async () => {
    const res = await request(app).get("/api/v1/comparison");
    expect(res.status).toBe(400);
  });
});
