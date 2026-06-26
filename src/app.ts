import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env";
import { notFoundHandler } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import { globalApiLimiter } from "./middlewares/rateLimiter";
import { checkBlockedIp } from "./middlewares/blockedIp.middleware";
import { resolveUploadRoot } from "./middlewares/upload.middleware";
import { buildSitemapEntries, entriesToXml, buildRobotsTxt } from "./services/seo/sitemap.service";
import apiRouter from "./routes";

export function createApp(): Application {
  const app = express();

  // اعتماد به پراکسی جلویی (Nginx/Load balancer) تا req.ip واقعی باشد —
  // پایه‌ی درست‌کارکردن rate limiter و ثبت IP در LoginAttempt/UserSession
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // فایل‌های /uploads باید روی دامنه‌ی جدا (فرانت‌اند) هم قابل نمایش
      // باشند (مثلاً <img src="...">)، پس CORP پیش‌فرض same-origin را شل می‌کنیم
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProd ? "combined" : "dev"));

  app.use("/uploads", express.static(resolveUploadRoot()));

  app.get("/health", (_req, res) => {
    res.json({ success: true, message: "OK", uptime: process.uptime() });
  });

  // سئوی تکنیکال — آیتم ۲۳. اگر فرانت‌اند روی دامنه‌ی جدایی است، ساده‌ترین
  // راه این است که در همان فرانت یک rewrite بزنید:
  //   /sitemap.xml  →  https://api.yourdomain.com/sitemap.xml
  //   /robots.txt   →  https://api.yourdomain.com/robots.txt
  app.get("/sitemap.xml", async (_req, res) => {
    const entries = await buildSitemapEntries();
    res.type("application/xml").send(entriesToXml(entries));
  });
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(buildRobotsTxt());
  });

  app.use(checkBlockedIp);
  app.use(globalApiLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX));

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
