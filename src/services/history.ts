import { db } from "./database";

export type HistoryItem = {
  id: number;
  ean: string;
  product_name: string | null;
  brand: string | null;
  score: number | null;
  source: "food" | "beauty" | null;
  image_url: string | null;
  scanned_at: string; // ISO string

  sugars_100g?: number | null;
  salt_100g?: number | null;
  saturated_fat_100g?: number | null;
  protein_100g?: number | null;
  fibre_100g?: number | null;
  additives_n?: number | null;
  category_tag?: string | null;
};

/**
 * save a scanned product to history.
 * tore a snapshot so history works even if API data changes later.
 */
export function addToHistory(item: Omit<HistoryItem, "id">) {
  db.runSync(
    `INSERT OR REPLACE INTO history (ean, product_name, brand, score, source, image_url, scanned_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.ean,
      item.product_name,
      item.brand,
      item.score,
      item.source,
      item.image_url,
      item.scanned_at,

      item.sugars_100g ?? null,
      item.salt_100g ?? null,
      item.saturated_fat_100g ?? null,
      item.protein_100g ?? null,
      item.fibre_100g ?? null,
      item.additives_n ?? null,
      item.category_tag ?? null,
    ],
  );
}

/**
 * get history items newest first.
 */
export function getHistory(limit = 50): HistoryItem[] {
  const rows = db.getAllSync<HistoryItem>(
    `SELECT * FROM history ORDER BY scanned_at DESC LIMIT ?`,
    [limit],
  );
  return rows;
}

/**
 * clear all history.
 */
export function clearHistory() {
  db.runSync(`DELETE FROM history`);
}

// delete one history entry by its id
export function deleteHistoryItem(id: number) {
  db.runSync(`DELETE FROM history WHERE id = ?`, [id]);
}
