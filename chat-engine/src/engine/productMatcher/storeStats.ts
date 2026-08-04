import { Pool } from "pg";

export async function countActiveBrands(pool: Pool): Promise<number> {
  const res = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM "Brand" WHERE "isActive" = true`);
  return Number(res.rows[0]?.count ?? 0);
}
