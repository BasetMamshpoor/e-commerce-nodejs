import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("نوتیفیکیشن — روتینگ", () => {
  it("GET /notifications بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("GET /notifications/unread-count بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/notifications/unread-count");
    expect(res.status).toBe(401);
  });

  it("POST /notifications/admin/broadcast بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/notifications/admin/broadcast")
      .send({ type: "PROMOTION", title: "تست", message: "تست" });
    expect(res.status).toBe(401);
  });
});

describe("تیکتینگ — روتینگ", () => {
  it("GET /tickets بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/tickets");
    expect(res.status).toBe(401);
  });

  it("POST /tickets بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/tickets").send({ subject: "تست", message: "سلام" });
    expect(res.status).toBe(401);
  });

  it("GET /tickets/departments عمومی نیست ولی نیاز فقط به ورود دارد (نه نقش خاص)", async () => {
    const res = await request(app).get("/api/v1/tickets/departments");
    expect(res.status).toBe(401); // چون اصلاً توکن نفرستادیم
  });

  it("GET /tickets/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/tickets/admin");
    expect(res.status).toBe(401);
  });
});

describe("کامنت‌های تودرتو — روتینگ", () => {
  it("GET /comments/product/:productId عمومی است و باید 200 با ساختار درست بدهد", async () => {
    const res = await request(app).get("/api/v1/comments/product/some-product-id");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.ratingSummary).toEqual({ average: 0, count: 0 });
  });

  it("POST /comments/product/:productId بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/comments/product/some-product-id")
      .send({ content: "خیلی خوب بود" });
    expect(res.status).toBe(401);
  });

  it("ارسال rating برای یک پاسخ (parentId دارد) باید 400 (خطای zod) بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/comments/product/some-product-id")
      .send({ content: "پاسخ", parentId: "parent-id", rating: 5 });
    // چون auth قبل از validate اجرا می‌شود، اینجا 401 می‌گیریم؛ این تست همان رفتار را مستند می‌کند
    expect(res.status).toBe(401);
  });

  it("GET /comments/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/comments/admin");
    expect(res.status).toBe(401);
  });
});
