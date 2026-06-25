import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("روتینگ و میدلورهای پایه", () => {
  it("مسیر ناشناخته باید 404 برگرداند", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("ایجاد دسته‌بندی بدون توکن باید 401 برگرداند", async () => {
    const res = await request(app).post("/api/v1/categories").send({ name: "تست" });
    expect(res.status).toBe(401);
  });

  it("ایجاد برند بدون توکن باید 401 برگرداند", async () => {
    const res = await request(app).post("/api/v1/brands").send({ name: "تست" });
    expect(res.status).toBe(401);
  });

  it("لیست دسته‌بندی‌های عمومی بدون نیاز به توکن کار می‌کند", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("لیست عمومی محصولات با page نامعتبر باید 400 برگرداند", async () => {
    const res = await request(app).get("/api/v1/products?page=not-a-number");
    expect(res.status).toBe(400);
  });

  it("ثبت‌نام بدون رمز عبور معتبر باید 400 (خطای zod) برگرداند", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ identifier: "test@example.com", password: "123" });
    expect(res.status).toBe(400);
  });
});
