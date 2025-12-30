import type { Category, OcrReceipt, ReceiptItem, ReceiptTotals } from "@/lib/types";
import { createId, isCategory, parseDate, safeString, toNumber } from "@/server/utils";

const FALLBACK_STORE = "Unknown store";
const FALLBACK_CURRENCY = "CZK";

const NON_PRODUCT_KEYWORDS = [
  "штрих код",
  "barcode",
  "qr",
  "qr code",
  "код транз",
  "код авт",
  "epz",
  "pos",
  "картка",
  "карта",
  "card",
  "bonus",
  "бонус",
  "зниж",
  "скид",
  "пдв",
  "ндс",
  "vat",
  "tax",
  "сума",
  "итого",
  "итог",
  "subtotal",
  "total",
  "оплата",
  "payment",
  "cash",
  "безгот",
  "visa",
  "mastercard",
  "terminal",
  "термінал",
  "залишок",
  "на початок",
  "здача",
  "решта",
  "решт",
  "дяку",
  "thanks",
  "welcome",
  "online",
  "www",
  "http",
  "тел",
  "phone",
  "касир",
  "касса",
  "приватбанк",
  "privatbank",
  "monobank",
];

function isLikelyNonProduct(text: string) {
  const value = text.toLowerCase();
  return NON_PRODUCT_KEYWORDS.some((keyword) => value.includes(keyword));
}

function shouldIncludeItem(rawName: string, name: string, unitPrice: number, totalPrice: number) {
  const combined = `${rawName} ${name}`.trim();
  if (!combined) return false;
  if (isLikelyNonProduct(combined)) return false;
  if (unitPrice <= 0 && totalPrice <= 0) return false;
  return true;
}

function normalizeUnit(value: string) {
  const lowered = value.toLowerCase();
  if (/(kg|кг)/.test(lowered)) return "kg";
  if (/(g|г)/.test(lowered)) return "g";
  if (/(l|л)/.test(lowered)) return "l";
  if (/(pcs|шт|ks|pc)/.test(lowered)) return "pcs";
  if (/(pack|уп)/.test(lowered)) return "pack";
  if (/(m|м)/.test(lowered)) return "m";
  return value || "pcs";
}

function inferCategory(name: string): Category {
  const text = name.toLowerCase();
  if (/ticket|museum|cinema|concert|театр|кіно|кино/.test(text)) return "entertainment";
  if (/taxi|uber|bolt|bus|metro|tram|train|проїзд/.test(text)) return "transport";
  if (/tv|laptop|phone|headphone|adapter|cable|usb|charger/.test(text)) return "electronics";
  if (/soap|detergent|clean|jar|shampoo|paper|towel|napkin/.test(text)) return "household";
  if (/milk|bread|cheese|tomato|apple|banana|egg|egg|juice|coke|cola|meat|fish|potato|onion/.test(text)) {
    return "grocery";
  }
  return "other";
}

export type NormalizedReceipt = {
  store: string;
  currency: string;
  purchasedAt: string;
  totals: ReceiptTotals;
  items: ReceiptItem[];
};

export function normalizeReceipt(input: OcrReceipt | unknown): NormalizedReceipt {
  const receipt = (input ?? {}) as OcrReceipt;
  const store = safeString(receipt.store?.name) || FALLBACK_STORE;
  const currency = safeString(receipt.currency) || FALLBACK_CURRENCY;
  const purchasedAt = parseDate(receipt.purchased_at) || new Date().toISOString();

  const itemsRaw = Array.isArray(receipt.items) ? receipt.items : [];
  const items: ReceiptItem[] = itemsRaw
    .map((item) => {
      const rawName = safeString(item?.raw_name) || safeString(item?.name);
      const name = safeString(item?.name) || rawName || "Unknown item";
      if (!rawName && !name) return null;
      const unitValue = normalizeUnit(safeString(item?.unit));
      const quantity = toNumber(item?.quantity, 1);
      const unitPrice = toNumber(item?.unit_price, 0);
      const totalPrice = toNumber(item?.total_price, unitPrice * quantity);
      const discount = toNumber(item?.discount, 0);
      const category = isCategory(item?.category)
        ? (item?.category as Category)
        : inferCategory(name);

      if (!shouldIncludeItem(rawName, name, unitPrice, totalPrice)) return null;

      return {
        id: createId(),
        rawName,
        name,
        category,
        quantity: quantity > 0 ? quantity : 1,
        unit: unitValue || "pcs",
        unitPrice,
        totalPrice: totalPrice || unitPrice * (quantity > 0 ? quantity : 1),
        discount,
      };
    })
    .filter(Boolean) as ReceiptItem[];

  const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const grossTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemDiscountSum = items.reduce((sum, item) => sum + item.discount, 0);
  const discountItemsRaw = toNumber(receipt.totals?.discount_items, 0);
  const discountReceiptRaw = toNumber(receipt.totals?.discount_receipt, 0);
  const discountTotalRaw = toNumber(receipt.totals?.discount, 0);

  const discountItems = discountItemsRaw > 0 ? discountItemsRaw : itemDiscountSum;
  const computedSubtotal = grossTotal > 0 ? grossTotal : itemsTotal;
  const computedReceiptDiscount = Math.max(0, computedSubtotal - discountItems - itemsTotal);
  const discountReceipt =
    discountReceiptRaw > 0 ? discountReceiptRaw : Math.max(0, discountTotalRaw - discountItems) || computedReceiptDiscount;
  const discount = discountTotalRaw > 0 ? discountTotalRaw : discountItems + discountReceipt;

  const subtotal = toNumber(receipt.totals?.subtotal, computedSubtotal);
  const totalFromReceipt = toNumber(receipt.totals?.total, 0);
  const computedTotal = subtotal - discount;
  const total =
    totalFromReceipt > 0 && Math.abs(totalFromReceipt - computedTotal) <= 0.05
      ? totalFromReceipt
      : computedTotal || itemsTotal;

  const totals: ReceiptTotals = {
    subtotal: subtotal || itemsTotal,
    discount,
    discountItems,
    discountReceipt,
    total,
    paymentMethod: safeString(receipt.totals?.payment_method) || null,
  };

  return {
    store,
    currency,
    purchasedAt,
    totals,
    items,
  };
}
