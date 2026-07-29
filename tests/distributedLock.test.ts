import { withLock } from "../src/lib/distributedLock";
import { redis } from "../src/lib/redis";

describe("withLock (قفل توزیع‌شده‌ی Redis)", () => {
  const lockName = `test-lock-${Date.now()}`;

  beforeAll(async () => {
    if (redis && redis.status !== "ready") {
      const client = redis;
      await new Promise<void>((resolve) => {
        client.once("ready", () => resolve());
        setTimeout(resolve, 2000);
      });
    }
  });

  afterEach(async () => {
    if (redis) await redis.del(`lock:${lockName}`);
  });

  it("دو اجرای هم‌زمان: فقط یکی واقعاً fn را اجرا می‌کند", async () => {
    let runningCount = 0;
    let maxConcurrent = 0;
    let totalRuns = 0;

    const task = async () => {
      runningCount += 1;
      maxConcurrent = Math.max(maxConcurrent, runningCount);
      await new Promise((resolve) => setTimeout(resolve, 100));
      totalRuns += 1;
      runningCount -= 1;
    };

    await Promise.all([
      withLock(lockName, 5000, task),
      withLock(lockName, 5000, task),
    ]);

    expect(maxConcurrent).toBe(1);
    expect(totalRuns).toBe(1); // دومی چون قفل را نگرفت، اصلاً اجرا نشد
  });

  it("بعد از آزادشدن قفل، اجرای بعدی می‌تواند دوباره قفل را بگیرد", async () => {
    let runs = 0;
    await withLock(lockName, 5000, async () => {
      runs += 1;
    });
    await withLock(lockName, 5000, async () => {
      runs += 1;
    });
    expect(runs).toBe(2);
  });

  it("حتی اگر fn خطا بدهد، قفل آزاد می‌شود (finally)", async () => {
    await expect(
      withLock(lockName, 5000, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    let ranAfterFailure = false;
    await withLock(lockName, 5000, async () => {
      ranAfterFailure = true;
    });
    expect(ranAfterFailure).toBe(true);
  });
});
