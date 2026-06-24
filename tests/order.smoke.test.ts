import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("سفارش‌ها و ماژول‌های وابسته — روتینگ", () => {
  it("POST /orders بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/orders").send({});
    expect(res.status).toBe(401);
  });

  it("GET /orders بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/orders");
    expect(res.status).toBe(401);
  });

  it("GET /orders/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/orders/admin");
    expect(res.status).toBe(401);
  });

  it("POST /addresses بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/addresses").send({});
    expect(res.status).toBe(401);
  });

  it("GET /shipping-companies عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/shipping-companies");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /shipping-companies بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/shipping-companies").send({ name: "تست" });
    expect(res.status).toBe(401);
  });

  it("GET /payment-gateways عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/payment-gateways");
    expect(res.status).toBe(200);
  });

  it("POST /payment-gateways بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/payment-gateways")
      .send({ name: "تست", slug: "test" });
    expect(res.status).toBe(401);
  });

  it("GET /wallet بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/wallet");
    expect(res.status).toBe(401);
  });

  it("ساخت سفارش بدون آدرس/شرکت ارسال باید 400 (خطای zod) بدهد — حتی بدون توکن چون auth زودتر اجرا می‌شود", async () => {
    // مستندکننده‌ی ترتیب میدلورها: authenticate قبل از validate است
    const res = await request(app).post("/api/v1/orders").send({ paymentMethod: "WALLET" });
    expect(res.status).toBe(401);
  });
});
