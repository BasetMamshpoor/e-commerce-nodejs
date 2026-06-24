// تقسیم متناسب یک مقدار کل بین چند آیتم بر اساس وزن هرکدام، بدون از دست‌رفتن
// باقیمانده‌ی رُند کردن (باقیمانده به آخرین آیتم اضافه می‌شود تا جمع دقیقاً
// برابر total بماند).
export function allocateProportionally(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (total <= 0 || weightSum <= 0) return weights.map(() => 0);

  const shares = weights.map((w) => Math.floor((total * w) / weightSum));
  const allocated = shares.reduce((s, v) => s + v, 0);
  const remainder = total - allocated;

  if (remainder > 0 && shares.length > 0) {
    shares[shares.length - 1] += remainder;
  }

  return shares;
}
