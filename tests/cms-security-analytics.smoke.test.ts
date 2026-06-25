import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("بنر و پاپ‌آپ — روتینگ", () => {
  it("GET /banners عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/banners");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /banners بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/banners").send({});
    expect(res.status).toBe(401);
  });

  it("GET /popups عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/popups");
    expect(res.status).toBe(200);
  });

  it("POST /popups بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/popups").send({});
    expect(res.status).toBe(401);
  });
});

describe("مدیریت کاربران/امنیت — روتینگ", () => {
  it("GET /users/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/users/admin");
    expect(res.status).toBe(401);
  });

  it("PUT /users/admin/:id/block بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .put("/api/v1/users/admin/some-id/block")
      .send({ reason: "تست" });
    expect(res.status).toBe(401);
  });

  it("GET /security/blocked-ips بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/security/blocked-ips");
    expect(res.status).toBe(401);
  });

  it("POST /security/blocked-ips بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/security/blocked-ips").send({ ip: "1.2.3.4" });
    expect(res.status).toBe(401);
  });
});

describe("آنالیز — روتینگ", () => {
  it("GET /analytics/overview بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/analytics/overview");
    expect(res.status).toBe(401);
  });

  it("GET /analytics/sales-over-time بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/analytics/sales-over-time");
    expect(res.status).toBe(401);
  });

  it("GET /analytics/top-products با limit نامعتبر هم اول 401 می‌گیرد (auth قبل از validate)", async () => {
    const res = await request(app).get("/api/v1/analytics/top-products?limit=999");
    expect(res.status).toBe(401);
  });
});
