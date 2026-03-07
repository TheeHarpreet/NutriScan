import * as SQLite from "expo-sqlite";

/**
 * createthe local SQLite database file.
 * the file is stored on the device.
 */
export const db = SQLite.openDatabaseSync("nutriscan.db");

/**SQLite does not support ADD COLUMN IF NOT EXISTS,
 * this helper checks the table structure first using PRAGMA,
 * and only adds the column if it is missing,
 * this prevents errors if the app already created the table in a previous version
 **/
function addColumnIfMissing(table: string, column: string, type: string) {
  try {
    const info = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(${table});`,
    );
    const exists = info.some((c) => c.name === column);
    if (!exists) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    }
  } catch (e) {
    console.log("DB column check failed:", table, column);
  }
}

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

  // extra food fields for personalisation
  // history
  addColumnIfMissing("history", "sugars_100g", "REAL");
  addColumnIfMissing("history", "salt_100g", "REAL");
  addColumnIfMissing("history", "saturated_fat_100g", "REAL");
  addColumnIfMissing("history", "protein_100g", "REAL");
  addColumnIfMissing("history", "fibre_100g", "REAL");
  addColumnIfMissing("history", "additives_n", "INTEGER");
  addColumnIfMissing("history", "category_tag", "TEXT");

  // favourites
  addColumnIfMissing("favourites", "sugars_100g", "REAL");
  addColumnIfMissing("favourites", "salt_100g", "REAL");
  addColumnIfMissing("favourites", "saturated_fat_100g", "REAL");
  addColumnIfMissing("favourites", "protein_100g", "REAL");
  addColumnIfMissing("favourites", "fibre_100g", "REAL");
  addColumnIfMissing("favourites", "additives_n", "INTEGER");
  addColumnIfMissing("favourites", "category_tag", "TEXT");

  db.execSync(`CREATE INDEX IF NOT EXISTS idx_history_ean ON history (ean);`);
  db.execSync(
    `CREATE INDEX IF NOT EXISTS idx_history_scanned_at ON history (scanned_at);`,
  );
  db.execSync(
    `CREATE INDEX IF NOT EXISTS idx_favourites_ean ON favourites (ean);`,
  );
}
