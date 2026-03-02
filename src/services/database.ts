import * as SQLite from "expo-sqlite";

/**
 * createthe local SQLite database file.
 * the file is stored on the device.
 */
export const db = SQLite.openDatabaseSync("nutriscan.db");

/**
 * initialise the database tables (run once on app start).
 * if the table already exists, it won’t be recreated.
 */
export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ean TEXT NOT NULL UNIQUE,
      product_name TEXT,
      brand TEXT,
      score INTEGER,
      source TEXT,
      image_url TEXT,
      scanned_at TEXT NOT NULL
    );
  `);

  db.execSync(`
  CREATE TABLE IF NOT EXISTS favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ean TEXT NOT NULL UNIQUE,
    product_name TEXT,
    brand TEXT,
    score INTEGER,
    source TEXT,
    image_url TEXT,
    added_at TEXT NOT NULL
  );
`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_history_ean ON history (ean);`);
  db.execSync(
    `CREATE INDEX IF NOT EXISTS idx_history_scanned_at ON history (scanned_at);`,
  );
  db.execSync(
    `CREATE INDEX IF NOT EXISTS idx_favourites_ean ON favourites (ean);`,
  );
}
