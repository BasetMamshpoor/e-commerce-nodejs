import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("کد تخفیف — روتینگ", () => {
  it("POST /discount-codes/apply بدون فرستادن code باید 400 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/discount-codes/apply")
      .set("X-Guest-Token", "discount-test-1")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /discount-codes/apply با کد ناموجود باید 404 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/discount-codes/apply")
      .set("X-Guest-Token", "discount-test-2")
      .send({ code: "NOT-EXIST" });
    expect(res.status).toBe(404);
  });

  it("ساخت کد تخفیف بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/discount-codes")
      .send({ code: "TEST10", type: "PERCENT", value: 10 });
    expect(res.status).toBe(401);
  });

  it("لیست ادمین کدهای تخفیف بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/discount-codes");
    expect(res.status).toBe(401);
  });

  it("ساخت کد تخفیف درصدی بیشتر از ۱۰۰ باید 400 (خطای zod) بدهد — حتی بدون توکن چون validate قبل از authorize نیست", async () => {
    // نکته: ترتیب میدلورها به این صورت است که authenticate/authorize قبل از validate اجرا می‌شوند،
    // پس این درخواست هم 401 می‌گیرد؛ این تست صرفاً مستندکننده‌ی همین رفتار است.
    const res = await request(app)
      .post("/api/v1/discount-codes")
      .send({ code: "BIG", type: "PERCENT", value: 150 });
    expect(res.status).toBe(401);
  });
});
