import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("پروفایل کاربر — روتینگ", () => {
  it("GET /users/me بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("PUT /users/me/password بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .put("/api/v1/users/me/password")
      .send({ currentPassword: "a", newPassword: "Abc12345" });
    expect(res.status).toBe(401);
  });

  it("POST /users/me/change-identifier/request بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/users/me/change-identifier/request")
      .send({ newIdentifier: "test@example.com" });
    expect(res.status).toBe(401);
  });
});

describe("تنظیمات سایت — روتینگ", () => {
  it("GET /settings عمومی است و باید 200 با شیء خالی بدهد", async () => {
    const res = await request(app).get("/api/v1/settings");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  it("GET /settings/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/settings/admin");
    expect(res.status).toBe(401);
  });

  it("PUT /settings/admin/:key بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .put("/api/v1/settings/admin/store_name")
      .send({ value: "فروشگاه من" });
    expect(res.status).toBe(401);
  });
});

describe("سئو — sitemap.xml و robots.txt", () => {
  it("GET /sitemap.xml باید 200 و XML معتبر برگرداند", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/xml/);
    expect(res.text).toContain("<urlset");
    expect(res.text).toContain("<loc>");
  });

  it("GET /robots.txt باید 200 و حاوی خط Sitemap باشد", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Sitemap:");
    expect(res.text).toContain("Disallow: /api/");
  });
});
