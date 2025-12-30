import { categories, type Category } from "@/lib/types";

export function createId() {
  return crypto.randomUUID();
}

export function safeString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  const match = trimmed.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const fallback = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();
  }
  return null;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && categories.includes(value as Category);
}
