import { db } from "./database";

export function isFavourite(ean: string): boolean {
  const rows = db.getAllSync(
    `SELECT id FROM favourites WHERE ean = ? LIMIT 1`,
    [ean],
  );
  return rows.length > 0;
}

export function addFavourite(item: {
  ean: string;
  product_name: string | null;
  brand: string | null;
  score: number | null;
  source: "food" | "beauty" | null;
  image_url: string | null;

  sugars_100g?: number | null;
  salt_100g?: number | null;
  saturated_fat_100g?: number | null;
  protein_100g?: number | null;
  fibre_100g?: number | null;
  additives_n?: number | null;
  category_tag?: string | null;
}) {
  db.runSync(
    `INSERT OR REPLACE INTO favourites (ean, product_name, brand, score, source, image_url, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.ean,
      item.product_name,
      item.brand,
      item.score,
      item.source,
      item.image_url,
      new Date().toISOString(),

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

export function removeFavourite(ean: string) {
  db.runSync(`DELETE FROM favourites WHERE ean = ?`, [ean]);
}

export function getFavourites(limit = 200) {
  return db.getAllSync(
    `SELECT * FROM favourites ORDER BY added_at DESC LIMIT ?`,
    [limit],
  );
}

// helper for showing how many favourites the user has saved
export function getFavouritesCount() {
  return db.getAllSync(`SELECT id FROM favourites`).length;
}
