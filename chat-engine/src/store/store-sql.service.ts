import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Pool } from "pg";
import { env } from "../config/env";

// ----------------------------------------------------------------------------
// موتور مستقیماً و فقط برای خواندن به دیتابیس Postgres فروشگاه وصل می‌شود
// (بدون واسطه‌ی API و بدون Prisma) — با SQL خام. این باعث می‌شود موتور به
// هیچ کلاینت تولیدشده یا نسخه‌ی مشخصی از اسکیمای بک‌اند وابسته نباشد و
// بشود همین کد را برای چند تنانت/بک‌اند مختلف استفاده کرد؛ کافیست هرکدام
// connection string خودشان را بدهند. یک Pool به‌ازای هر connection string
// کش می‌شود.
// ----------------------------------------------------------------------------

@Injectable()
export class StoreSqlService implements OnApplicationShutdown {
  private readonly pools = new Map<string, Pool>();

  getPool(connectionString: string): Pool {
    const existing = this.pools.get(connectionString);
    if (existing) return existing;

    const pool = new Pool({ connectionString, max: env.STORE_DB_POOL_MAX });
    this.pools.set(connectionString, pool);
    return pool;
  }

  async onApplicationShutdown() {
    await Promise.all([...this.pools.values()].map((pool) => pool.end()));
    this.pools.clear();
  }
}
