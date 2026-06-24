import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("رسانه (Media) — روتینگ", () => {
  it("POST /media بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/media");
    expect(res.status).toBe(401);
  });

  it("POST /media بدون فایل (حتی با توکن فرضی نامعتبر) باید قبل از آن 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/media")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
  });

  it("GET /media (لیست مدیریتی) بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/media");
    expect(res.status).toBe(401);
  });

  it("DELETE /media/:id بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).delete("/api/v1/media/some-id");
    expect(res.status).toBe(401);
  });

  it("مسیر استاتیک /uploads برای فایل ناموجود باید 404 بدهد (نه کرش)", async () => {
    const res = await request(app).get("/uploads/does-not-exist.jpg");
    expect(res.status).toBe(404);
  });
});
