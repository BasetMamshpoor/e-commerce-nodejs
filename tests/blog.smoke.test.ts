import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("وبلاگ — روتینگ", () => {
  it("GET /blog عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/blog");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("GET /blog/categories عمومی است و باید 200 بدهد", async () => {
    const res = await request(app).get("/api/v1/blog/categories");
    expect(res.status).toBe(200);
  });

  it("POST /blog بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/blog").send({ title: "تست", content: "..." });
    expect(res.status).toBe(401);
  });

  it("POST /blog/categories بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).post("/api/v1/blog/categories").send({ name: "تست" });
    expect(res.status).toBe(401);
  });

  it("GET /blog/admin بدون توکن باید 401 بدهد", async () => {
    const res = await request(app).get("/api/v1/blog/admin");
    expect(res.status).toBe(401);
  });
});

describe("کامنت پلی‌مورفیک روی پست وبلاگ — روتینگ", () => {
  it("GET /comments/blog/:postId عمومی است و باید 200 با ساختار درست بدهد", async () => {
    const res = await request(app).get("/api/v1/comments/blog/some-post-id");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.ratingSummary).toEqual({ average: 0, count: 0 });
  });

  it("POST /comments/blog/:postId بدون توکن باید 401 بدهد", async () => {
    const res = await request(app)
      .post("/api/v1/comments/blog/some-post-id")
      .send({ content: "دیدگاه تستی" });
    expect(res.status).toBe(401);
  });
});

describe("سئو — sitemap باید شامل وبلاگ هم باشد", () => {
  it("GET /sitemap.xml باید بدون خطا و معتبر بماند حتی بدون پست وبلاگ", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<urlset");
  });
});
