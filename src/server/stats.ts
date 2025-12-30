import { categories, type Stats } from "@/lib/types";
import { readDb } from "@/server/db";

export function computeStats(): Stats {
  const { receipts } = readDb();
  const monthlyMap = new Map<string, number>();
  const monthlySavingsMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  for (const category of categories) {
    categoryMap.set(category, 0);
  }

  let savedTotal = 0;
  let totalSpent = 0;
  let largestReceipt = 0;

  for (const receipt of receipts) {
    const date = new Date(receipt.purchasedAt || receipt.createdAt);
    const monthKey = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const receiptTotal = receipt.totals.total || 0;
    const receiptSaved = receipt.totals.discount || 0;

    const current = monthlyMap.get(monthKey) ?? 0;
    monthlyMap.set(monthKey, current + receiptTotal);

    const savedCurrent = monthlySavingsMap.get(monthKey) ?? 0;
    monthlySavingsMap.set(monthKey, savedCurrent + receiptSaved);

    totalSpent += receiptTotal;
    savedTotal += receiptSaved;
    largestReceipt = Math.max(largestReceipt, receiptTotal);

    for (const item of receipt.items) {
      const total = categoryMap.get(item.category) ?? 0;
      categoryMap.set(item.category, total + (item.totalPrice || 0));
    }
  }

  const months = Array.from(
    new Set([...monthlyMap.keys(), ...monthlySavingsMap.keys()])
  )
    .filter((key) => key !== "unknown")
    .sort((a, b) => (a > b ? 1 : -1));

  const monthly = months.map((month) => ({
    month,
    total: monthlyMap.get(month) ?? 0,
  }));

  const monthlySavings = months.map((month) => ({
    month,
    saved: monthlySavingsMap.get(month) ?? 0,
  }));

  const categoriesTotals = categories.map((category) => ({
    category,
    total: categoryMap.get(category) ?? 0,
  }));

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalThisMonth = monthlyMap.get(currentMonthKey) ?? 0;
  const savedThisMonth = monthlySavingsMap.get(currentMonthKey) ?? 0;
  const savingsRate = totalThisMonth + savedThisMonth > 0
    ? savedThisMonth / (totalThisMonth + savedThisMonth)
    : 0;

  const itemsCount = receipts.reduce((sum, receipt) => sum + receipt.items.length, 0);
  const averageReceipt = receipts.length > 0 ? totalSpent / receipts.length : 0;

  return {
    totalThisMonth,
    savedThisMonth,
    savedTotal,
    savingsRate,
    averageReceipt,
    largestReceipt,
    monthly,
    monthlySavings,
    categories: categoriesTotals,
    receiptsCount: receipts.length,
    itemsCount,
  };
}
