import express from "express";
import request from "supertest";
import { resolveMediaUrls } from "../src/middlewares/resolveMediaUrls.middleware";
import { stripOrigin } from "../scripts/normalize-media-urls";
import { getStorageProvider } from "../src/services/media/local-storage.provider";

describe("getUrl (LocalStorageProvider) — فقط مسیر نسبی برمی‌گرداند", () => {
  it("هرگز دامنه/پورت را داخل URL برنمی‌گرداند", () => {
    const url = getStorageProvider().getUrl("products/2026/07/test.jpg");
    expect(url).toBe("/uploads/products/2026/07/test.jpg");
    expect(url).not.toMatch(/^https?:\/\//);
  });
});

describe("resolveMediaUrls middleware", () => {
  it("مسیرهای نسبی /uploads/... را با APP_BASE_URL کامل می‌کند", async () => {
    const app = express();
    app.use(resolveMediaUrls());
    app.get("/test", (_req, res) => {
      res.json({
        product: {
          name: "تست",
          images: ["/uploads/products/a.jpg", "/uploads/products/b.jpg"],
          brand: { logoUrl: "/uploads/brands/logo.png" },
        },
        unrelatedField: "این یک رشته‌ی معمولی است",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    });

    const res = await request(app).get("/test");
    expect(res.body.product.images[0]).toMatch(/^https?:\/\/.+\/uploads\/products\/a\.jpg$/);
    expect(res.body.product.images[1]).toMatch(/^https?:\/\/.+\/uploads\/products\/b\.jpg$/);
    expect(res.body.product.brand.logoUrl).toMatch(/^https?:\/\/.+\/uploads\/brands\/logo\.png$/);
  });

  it("رشته‌های غیر رسانه‌ای را دست‌نخورده می‌گذارد", async () => {
    const app = express();
    app.use(resolveMediaUrls());
    app.get("/test", (_req, res) => {
      res.json({ note: "این یک رشته‌ی معمولی است", link: "https://example.com/not-uploads" });
    });

    const res = await request(app).get("/test");
    expect(res.body.note).toBe("این یک رشته‌ی معمولی است");
    expect(res.body.link).toBe("https://example.com/not-uploads");
  });

  it("مقدار Date را خراب نمی‌کند (رگرسیون: نباید {} برگرداند)", async () => {
    const app = express();
    app.use(resolveMediaUrls());
    app.get("/test", (_req, res) => {
      res.json({ createdAt: new Date("2026-05-05T10:00:00.000Z") });
    });

    const res = await request(app).get("/test");
    expect(res.body.createdAt).toBe("2026-05-05T10:00:00.000Z");
  });

  it("URL کامل قدیمی (قبل از migration) را دست‌نخورده می‌گذارد (نه double-prefix)", async () => {
    const app = express();
    app.use(resolveMediaUrls());
    app.get("/test", (_req, res) => {
      res.json({ logoUrl: "http://old-domain.com:5000/uploads/brands/old.png" });
    });

    const res = await request(app).get("/test");
    expect(res.body.logoUrl).toBe("http://old-domain.com:5000/uploads/brands/old.png");
  });
});

describe("saveFileToMedia (end-to-end) — Media.url ذخیره‌شده در دیتابیس باید نسبی باشد", () => {
  it("بعد از آپلود واقعی، Media.url هیچ دامنه/پورتی ندارد", async () => {
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");
    const { saveFileToMedia } = await import("../src/services/media/media.service");
    const { prisma } = await import("../src/lib/prisma");

    const tmpPath = path.join(os.tmpdir(), `test-upload-${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, "fake-image-content");

    const fakeFile = {
      path: tmpPath,
      mimetype: "image/jpeg",
      originalname: "test.jpg",
      size: fs.statSync(tmpPath).size,
    } as Express.Multer.File;

    const saved = await saveFileToMedia(fakeFile, "test-uploads");

    expect(saved.url).not.toMatch(/^https?:\/\//);
    expect(saved.url).toMatch(/^\/uploads\//);

    const inDb = await prisma.media.findUnique({ where: { id: saved.id } });
    expect(inDb?.url).not.toMatch(/^https?:\/\//);
    expect(inDb?.url).toMatch(/^\/uploads\//);

    await prisma.media.delete({ where: { id: saved.id } }).catch(() => {});
  });
});

describe("stripOrigin (اسکریپت migration داده‌های قدیمی)", () => {
  it("پیشوند دامنه/پورت قدیمی را می‌بُرد و فقط مسیر نسبی را نگه می‌دارد", () => {
    expect(stripOrigin("http://localhost:4000/uploads/products/a.jpg")).toBe("/uploads/products/a.jpg");
    expect(stripOrigin("https://old-domain.com/uploads/brands/logo.png")).toBe("/uploads/brands/logo.png");
    expect(stripOrigin("http://mrkafshdoz.com:4000/uploads/x/y.png")).toBe("/uploads/x/y.png");
  });

  it("مقادیر از قبل نسبی را دست‌نخورده می‌گذارد (idempotent)", () => {
    expect(stripOrigin("/uploads/products/a.jpg")).toBe("/uploads/products/a.jpg");
  });

  it("مقدار null را null برمی‌گرداند", () => {
    expect(stripOrigin(null)).toBeNull();
  });
});
