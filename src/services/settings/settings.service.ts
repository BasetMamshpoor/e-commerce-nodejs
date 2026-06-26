import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { UpsertSettingInput } from "../../validations/settings.validation";
import { Setting } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// تنظیمات سراسری سایت به‌صورت کلید-مقدار (نام فروشگاه، شبکه‌های اجتماعی،
// متای پیش‌فرض سئو و ...). فقط برای مقادیر غیرحساس — کلیدهای امنیتی/رمز
// همیشه باید در .env بمانند، نه اینجا.
// ----------------------------------------------------------------------------

function parseValue(setting: Setting): unknown {
  switch (setting.type) {
    case "number":
      return Number(setting.value);
    case "boolean":
      return setting.value === "true";
    case "json":
      try {
        return JSON.parse(setting.value);
      } catch {
        return null;
      }
    default:
      return setting.value;
  }
}

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, unknown> = {};
  for (const s of settings) result[s.key] = parseValue(s);
  return result;
}

export async function listSettingsAdmin(): Promise<Setting[]> {
  return prisma.setting.findMany({ orderBy: { key: "asc" } });
}

export async function upsertSetting(key: string, input: UpsertSettingInput): Promise<Setting> {
  if (input.type === "json") {
    try {
      JSON.parse(input.value);
    } catch {
      throw ApiError.badRequest("مقدار json نامعتبر است");
    }
  }
  if (input.type === "number" && Number.isNaN(Number(input.value))) {
    throw ApiError.badRequest("مقدار عددی نامعتبر است");
  }

  return prisma.setting.upsert({
    where: { key },
    create: { key, value: input.value, type: input.type },
    update: { value: input.value, type: input.type },
  });
}

export async function deleteSetting(key: string): Promise<void> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) throw ApiError.notFound("تنظیمات پیدا نشد");
  await prisma.setting.delete({ where: { key } });
}
