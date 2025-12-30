export const categories = [
  "grocery",
  "household",
  "electronics",
  "entertainment",
  "transport",
  "other",
] as const;

export type Category = (typeof categories)[number];

export type ReceiptItem = {
  id: string;
  rawName: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
};

export type ReceiptTotals = {
  subtotal: number;
  discount: number;
  discountItems?: number;
  discountReceipt?: number;
  total: number;
  paymentMethod?: string | null;
};

export type Receipt = {
  id: string;
  createdAt: string;
  purchasedAt: string;
  store: string;
  currency: string;
  totals: ReceiptTotals;
  items: ReceiptItem[];
};

export type PricePoint = {
  date: string;
  price: number;
  receiptId: string;
};

export type Product = {
  id: string;
  store: string;
  rawName: string;
  name: string;
  category: Category;
  unit: string;
  lastPrice: number;
  priceHistory: PricePoint[];
};

export type Stats = {
  totalThisMonth: number;
  savedThisMonth: number;
  savedTotal: number;
  savingsRate: number;
  averageReceipt: number;
  largestReceipt: number;
  monthly: { month: string; total: number }[];
  monthlySavings: { month: string; saved: number }[];
  categories: { category: Category; total: number }[];
  receiptsCount: number;
  itemsCount: number;
};

export type OcrReceipt = {
  store?: { name?: string | null; address?: string | null } | null;
  purchased_at?: string | null;
  currency?: string | null;
  items?: Array<{
    raw_name?: string | null;
    name?: string | null;
    category?: Category | string | null;
    quantity?: number | string | null;
    unit?: string | null;
    unit_price?: number | string | null;
    total_price?: number | string | null;
    discount?: number | string | null;
  }> | null;
  totals?: {
    subtotal?: number | string | null;
    discount?: number | string | null;
    discount_items?: number | string | null;
    discount_receipt?: number | string | null;
    total?: number | string | null;
    payment_method?: string | null;
  } | null;
};
