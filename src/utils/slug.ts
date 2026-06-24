// ----------------------------------------------------------------------------
// تولید slug با پشتیبانی از حروف فارسی/عربی (به‌جای حذف‌کردنشان مثل بعضی
// کتابخانه‌های لاتین‌محور). فقط کاراکترهای فاصله و نشانه‌گذاری را با خط تیره
// جای‌گزین می‌کنیم و حروف/اعداد یونیکد را نگه می‌داریم.
// ----------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // هر چیزی که حرف یا عدد یونیکد نیست را با خط تیره جای‌گزین کن
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// اگر slug پایه از قبل وجود داشت، با پسوند عددی (-2، -3، ...) یکتا می‌شود
export async function ensureUniqueSlug(
  baseInput: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(baseInput) || "item";
  let candidate = base;
  let counter = 2;

  while (await exists(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}
