import type { Product, Receipt } from "@/lib/types";
import { readDb, writeDb } from "@/server/db";
import { normalizeReceipt } from "@/server/normalize";
import { createId } from "@/server/utils";

export function getReceipts() {
  return readDb().receipts;
}

export function getReceipt(id: string) {
  return readDb().receipts.find((receipt) => receipt.id === id) || null;
}

export function getProducts() {
  return readDb().products;
}

export function getProduct(id: string) {
  return readDb().products.find((product) => product.id === id) || null;
}

export function addReceiptFromOcr(raw: unknown): Receipt {
  const normalized = normalizeReceipt(raw);
  const receipt: Receipt = {
    id: createId(),
    createdAt: new Date().toISOString(),
    purchasedAt: normalized.purchasedAt,
    store: normalized.store,
    currency: normalized.currency,
    totals: normalized.totals,
    items: normalized.items,
  };

  const db = readDb();
  db.receipts.unshift(receipt);
  db.products = upsertProducts(db.products, receipt);
  writeDb(db);
  return receipt;
}

export function updateReceipt(id: string, raw: unknown): Receipt | null {
  const normalized = normalizeReceipt(raw);
  const db = readDb();
  const index = db.receipts.findIndex((receipt) => receipt.id === id);
  if (index === -1) return null;
  const existing = db.receipts[index];

  const updated: Receipt = {
    ...existing,
    purchasedAt: normalized.purchasedAt,
    store: normalized.store,
    currency: normalized.currency,
    totals: normalized.totals,
    items: normalized.items,
  };

  db.receipts[index] = updated;
  db.products = rebuildProducts(db.receipts, db.products);
  writeDb(db);
  return updated;
}

export function deleteReceipt(id: string) {
  const db = readDb();
  const nextReceipts = db.receipts.filter((receipt) => receipt.id !== id);
  if (nextReceipts.length === db.receipts.length) return false;
  db.receipts = nextReceipts;
  db.products = rebuildProducts(db.receipts, db.products);
  writeDb(db);
  return true;
}

function upsertProducts(existing: Product[], receipt: Receipt): Product[] {
  const updated = [...existing];
  for (const item of receipt.items) {
    const matchIndex = updated.findIndex(
      (product) => product.store === receipt.store && product.rawName === item.rawName
    );
    const pricePoint = {
      date: receipt.purchasedAt || receipt.createdAt,
      price: item.unitPrice,
      receiptId: receipt.id,
    };

    if (matchIndex === -1) {
      updated.push({
        id: createId(),
        store: receipt.store,
        rawName: item.rawName,
        name: item.name,
        category: item.category,
        unit: item.unit,
        lastPrice: item.unitPrice,
        priceHistory: [pricePoint],
      });
      continue;
    }

    const product = updated[matchIndex];
    const shouldUpdatePrice = item.unitPrice > 0 && item.unitPrice !== product.lastPrice;
    const updatedHistory = shouldUpdatePrice
      ? [...product.priceHistory, pricePoint]
      : product.priceHistory;
    const updatedCategory = product.category === "other" ? item.category : product.category;

    updated[matchIndex] = {
      ...product,
      name: product.name || item.name,
      category: updatedCategory,
      unit: product.unit || item.unit,
      lastPrice: shouldUpdatePrice ? item.unitPrice : product.lastPrice,
      priceHistory: updatedHistory,
    };
  }

  return updated;
}

function rebuildProducts(receipts: Receipt[], existingProducts: Product[]): Product[] {
  const idMap = new Map<string, string>();
  for (const product of existingProducts) {
    idMap.set(`${product.store}||${product.rawName}`, product.id);
  }

  const productsMap = new Map<string, Product>();
  const sortedReceipts = [...receipts].sort((a, b) => {
    const aDate = new Date(a.purchasedAt || a.createdAt).getTime();
    const bDate = new Date(b.purchasedAt || b.createdAt).getTime();
    return aDate - bDate;
  });

  for (const receipt of sortedReceipts) {
    for (const item of receipt.items) {
      const key = `${receipt.store}||${item.rawName}`;
      let product = productsMap.get(key);
      if (!product) {
        product = {
          id: idMap.get(key) || createId(),
          store: receipt.store,
          rawName: item.rawName,
          name: item.name,
          category: item.category,
          unit: item.unit,
          lastPrice: item.unitPrice,
          priceHistory: [],
        };
      }

      if (item.unitPrice > 0) {
        if (product.priceHistory.length === 0 || item.unitPrice !== product.lastPrice) {
          product.priceHistory.push({
            date: receipt.purchasedAt || receipt.createdAt,
            price: item.unitPrice,
            receiptId: receipt.id,
          });
          product.lastPrice = item.unitPrice;
        }
      }

      product = {
        ...product,
        name: product.name || item.name,
        category: product.category === "other" ? item.category : product.category,
        unit: product.unit || item.unit,
      };

      productsMap.set(key, product);
    }
  }

  return Array.from(productsMap.values());
}
