import type { Locale } from "@/lib/i18n";

export function formatMoney(amount: number, currency: string, locale: Locale) {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "CZK",
      currencyDisplay: "symbol",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
}

export function formatNumber(amount: number, locale: Locale) {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function formatDate(value: string, locale: Locale) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatMonthLabel(month: string, locale: Locale) {
  if (!month) return "";
  const [year, monthPart] = month.split("-");
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  }).format(date);
}
