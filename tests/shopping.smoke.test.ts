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

  it("افزودن به سبد با variantId نامعتبر باید 404 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("X-Guest-Token", "test-guest")
      .send({ variantId: "does-not-exist", quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("POST /cart/merge بدون توکن (لاگین) باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/cart/merge").send({ guestToken: "abc" });
    expect(res.status).toBe(401);
  });

  it("GET /wishlist بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/wishlist");
    expect(res.status).toBe(401);
  });

  it("GET /comparison برای مهمان بدون توکن باید 200 و لیست خالی بدهد", async () => {
    const res = await request(app).get("/api/v1/comparison");
    expect(res.status).toBe(200);
    expect(res.body.data.comparison.items).toEqual([]);
  });

  it("افزودن به مقایسه با productId نامعتبر باید 404 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/comparison")
      .set("X-Guest-Token", "test-guest-2")
      .send({ productId: "does-not-exist" });
    expect(res.status).toBe(404);
  });
});
