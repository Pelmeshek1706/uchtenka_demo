import fs from "fs";
import path from "path";
import type { Product, Receipt } from "@/lib/types";

export type Database = {
  receipts: Receipt[];
  products: Product[];
};

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const DEFAULT_DB: Database = { receipts: [], products: [] };

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

export function readDb(): Database {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw) as Database;
    if (!data.receipts || !data.products) return { ...DEFAULT_DB };
    return data;
  } catch {
    return { ...DEFAULT_DB };
  }
}

export function writeDb(db: Database) {
  ensureDbFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
