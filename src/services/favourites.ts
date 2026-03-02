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
