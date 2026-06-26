import { prisma } from "../../lib/prisma";
import { publicSiteUrl } from "../../config/env";

// ----------------------------------------------------------------------------
// sitemap.xml — آیتم ۲۳ (سئوی تکنیکال).
// ⚠️ فرض مسیرهای فرانت‌اند: /products/:slug ، /categories/:slug ،
// /brands/:slug . اگر ساختار route های سایت فرانت‌اند شما فرق دارد، همین
// چند خط را در buildUrl تغییر دهید.
// ----------------------------------------------------------------------------

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
}

function buildUrl(path: string): string {
  return `${publicSiteUrl}${path}`;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: SitemapEntry[] = [
    { loc: buildUrl("/"), lastmod: toIsoDate(new Date()), changefreq: "daily", priority: 1.0 },
  ];

  for (const p of products) {
    entries.push({
      loc: buildUrl(`/products/${p.slug}`),
      lastmod: toIsoDate(p.updatedAt),
      changefreq: "weekly",
      priority: 0.8,
    });
  }
  for (const c of categories) {
    entries.push({
      loc: buildUrl(`/categories/${c.slug}`),
      lastmod: toIsoDate(c.updatedAt),
      changefreq: "weekly",
      priority: 0.6,
    });
  }
  for (const b of brands) {
    entries.push({
      loc: buildUrl(`/brands/${b.slug}`),
      lastmod: toIsoDate(b.updatedAt),
      changefreq: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}

export function entriesToXml(entries: SitemapEntry[]): string {
  const urlTags = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(e.loc)}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        (e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>\n` : "") +
        (e.priority !== undefined ? `    <priority>${e.priority}</priority>\n` : "") +
        `  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin/",
    `Sitemap: ${buildUrl("/sitemap.xml")}`,
  ].join("\n");
}
