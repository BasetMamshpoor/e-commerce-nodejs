import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "../src/middlewares/validate";
import { errorHandler } from "../src/middlewares/errorHandler";

// ----------------------------------------------------------------------------
// این تست مخصوص یک باگ واقعی است که در توسعه پیدا شد: در Express 5،
// req.query فقط getter دارد و مستقیم قابل بازنویسی نیست. validate.ts باید
// خروجی zod روی query را در req.validatedQuery بگذارد، نه در req.query.
// اگر این تست قرمز شد، یعنی آن رفتار دوباره خراب شده.
// ----------------------------------------------------------------------------

describe("middlewares/validate", () => {
  it("روی query، خروجی coerce-شده را در req.validatedQuery می‌گذارد (نه در req.query) و کرش نمی‌کند", async () => {
    const schema = z.object({ page: z.coerce.number().int().positive().default(1) });
    const app = express();
    app.get("/test", validate(schema, "query"), (req, res) => {
      res.json({ validatedQuery: req.validatedQuery, rawQueryPage: req.query.page });
    });
    app.use(errorHandler);

    const res = await request(app).get("/test?page=3");
    expect(res.status).toBe(200);
    expect(res.body.validatedQuery).toEqual({ page: 3 });
    expect(res.body.rawQueryPage).toBe("3"); // req.query خام دست‌نخورده می‌ماند (همیشه string)
  });

  it("روی query با مقدار پیش‌فرض zod هم بدون کرش کار می‌کند (هیچ query ای نفرستاده نشود)", async () => {
    const schema = z.object({ page: z.coerce.number().int().positive().default(1) });
    const app = express();
    app.get("/test", validate(schema, "query"), (req, res) => {
      res.json({ validatedQuery: req.validatedQuery });
    });
    app.use(errorHandler);

    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.validatedQuery).toEqual({ page: 1 });
  });

  it("روی body، خروجی parse شده مستقیم جای‌گزین req.body می‌شود", async () => {
    const schema = z.object({ name: z.string().trim() });
    const app = express();
    app.use(express.json());
    app.post("/test", validate(schema), (req, res) => {
      res.json({ body: req.body });
    });
    app.use(errorHandler);

    const res = await request(app).post("/test").send({ name: "  علی  " });
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: "علی" });
  });

  it("روی query نامعتبر، 400 برمی‌گرداند (نه 500)", async () => {
    const schema = z.object({ page: z.coerce.number().int().positive() });
    const app = express();
    app.get("/test", validate(schema, "query"), (req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    const res = await request(app).get("/test?page=not-a-number");
    expect(res.status).toBe(400);
  });
});
