import request from "supertest";
import { createApp } from "../src/app";

describe("GET /health", () => {
  const app = createApp();

  it("بدون نیاز به دیتابیس باید 200 و success:true برگرداند", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
