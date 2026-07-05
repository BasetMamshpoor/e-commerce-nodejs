import { ApiError } from "./ApiError";

export function paramStr(value: string | string[] | undefined, name = "پارامتر"): string {
  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`${name} نامعتبر است`);
  }
  return value;
}

export function paramInt(value: string | string[] | undefined, name = "پارامتر"): number {
  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`${name} نامعتبر است`);
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw ApiError.badRequest(`${name} باید یک عدد صحیح مثبت باشد`);
  }
  return num;
}
