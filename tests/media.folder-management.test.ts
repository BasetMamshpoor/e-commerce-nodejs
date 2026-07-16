import { normalizeMediaFolderPath } from "../src/services/media/media.service";

describe("normalizeMediaFolderPath", () => {
  it("accepts valid year/month date folders and normalizes the prefix", () => {
    expect(normalizeMediaFolderPath("blog", "2026", "07")).toEqual({
      entityType: "blog",
      year: "2026",
      month: "07",
      prefix: "blog/2026/07",
    });
  });

  it("rejects unsafe entity, year, or month values", () => {
    expect(() => normalizeMediaFolderPath("../blog", "2026", "07")).toThrow(/معتبر/i);
    expect(() => normalizeMediaFolderPath("blog", "26", "07")).toThrow(/معتبر/i);
    expect(() => normalizeMediaFolderPath("blog", "2026", "7")).toThrow(/معتبر/i);
  });
});
