"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney } from "@/lib/format";
import { categories, type Category, type Receipt } from "@/lib/types";

const categoryPalette: Record<Category, string> = {
  grocery: "#20b485",
  household: "#f4b55f",
  electronics: "#4da3ff",
  entertainment: "#f76f6a",
  transport: "#22c55e",
  other: "#94a3b8",
};

function formatMonthLabel(month: string, locale: string) {
  const [year, monthPart] = month.split("-");
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthAxisLabel(month: string, locale: string, includeYear: boolean) {
  const [year, monthPart] = month.split("-");
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    ...(includeYear ? { year: "2-digit" } : {}),
  }).format(date);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const Wrapper: ElementType = href ? Link : "div";
  const props = href ? { href } : {};
  const className = href ? "surface stat-card cursor-pointer p-5" : "surface stat-card p-5";
  return (
    <Wrapper {...props} className={className}>
      <div className="stat-icon">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="stat-value mt-3">{value}</p>
      {hint ? <p className="stat-subtitle mt-2">{hint}</p> : null}
    </Wrapper>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((item) => item.value));
  const denominator = data.length > 1 ? data.length - 1 : 1;
  const points = data
    .map((item, index) => {
      const x = (index / denominator) * 100;
      const y = 100 - (item.value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-56 w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} />
          ))}
        </g>
        <polygon points={areaPoints} fill="url(#lineGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((item, index) => {
          const x = (index / denominator) * 100;
          const y = 100 - (item.value / max) * 100;
          return <circle key={item.label} cx={x} cy={y} r={2} fill="var(--accent)" />;
        })}
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function DonutChart({
  data,
  totalLabel,
  totalValue,
  formatValue,
}: {
  data: { label: string; value: number; color: string }[];
  totalLabel: string;
  totalValue: string;
  formatValue: (value: number) => string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#ede9fe"
            strokeWidth={stroke}
            fill="none"
          />
          {data.map((item) => {
            const dash = total > 0 ? (item.value / total) * circumference : 0;
            const currentOffset = offset;
            offset += dash;
            return (
              <circle
                key={item.label}
                cx="60"
                cy="60"
                r={radius}
                stroke={item.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-500">{totalLabel}</p>
          <p className="text-lg font-semibold text-slate-900">{totalValue}</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              <span className="text-slate-600">{item.label}</span>
            </div>
            <span className="text-slate-900">
              {formatValue(item.value)}
              {total > 0 ? ` (${Math.round((item.value / total) * 100)}%)` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [monthFilter, setMonthFilter] = useState("all");
  const [hasManualMonth, setHasManualMonth] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/receipts")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setReceipts((data.receipts as Receipt[]) ?? []);
      })
      .catch(() => {
        if (isMounted) setReceipts([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const months = useMemo(() => {
    const unique = new Set<string>();
    receipts.forEach((receipt) => {
      const date = new Date(receipt.purchasedAt || receipt.createdAt);
      if (!Number.isNaN(date.getTime())) unique.add(getMonthKey(date));
    });
    return Array.from(unique).sort((a, b) => (a > b ? -1 : 1));
  }, [receipts]);

  useEffect(() => {
    if (months.length === 0) return;
    if (monthFilter === "all") {
      if (!hasManualMonth) {
        setMonthFilter(months[0]);
      }
      return;
    }
    if (!months.includes(monthFilter)) {
      setMonthFilter(months[0]);
    }
  }, [months, monthFilter, hasManualMonth]);

  const stores = useMemo(() => {
    const unique = new Set(receipts.map((receipt) => receipt.store).filter(Boolean));
    return Array.from(unique).sort();
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const date = new Date(receipt.purchasedAt || receipt.createdAt);
      const monthKey = Number.isNaN(date.getTime()) ? "" : getMonthKey(date);
      const matchesMonth = monthFilter === "all" ? true : monthKey === monthFilter;
      const matchesStore = storeFilter === "all" ? true : receipt.store === storeFilter;
      return matchesMonth && matchesStore;
    });
  }, [receipts, monthFilter, storeFilter]);

  const metrics = useMemo(() => {
    let totalSpent = 0;
    let totalSaved = 0;
    let itemsCount = 0;
    let receiptsCount = 0;
    let largestReceipt = 0;

    filteredReceipts.forEach((receipt) => {
      const totalItemsValue = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const receiptItemDiscount = receipt.items.reduce((sum, item) => sum + item.discount, 0);
      const receiptDiscountItems = receipt.totals.discountItems ?? receiptItemDiscount;
      const receiptDiscountReceipt = receipt.totals.discountReceipt ?? Math.max(0, receipt.totals.discount - receiptDiscountItems);
      const filteredItems = categoryFilter === "all"
        ? receipt.items
        : receipt.items.filter((item) => item.category === categoryFilter);
      if (filteredItems.length === 0) return;
      const filteredTotal = filteredItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const filteredItemDiscount = filteredItems.reduce((sum, item) => sum + item.discount, 0);
      const allocatedReceiptDiscount = totalItemsValue > 0
        ? receiptDiscountReceipt * (filteredTotal / totalItemsValue)
        : 0;
      const saved = filteredItemDiscount + allocatedReceiptDiscount;

      totalSpent += filteredTotal;
      totalSaved += saved;
      itemsCount += filteredItems.length;
      receiptsCount += 1;
      largestReceipt = Math.max(largestReceipt, filteredTotal);
    });

    const averageReceipt = receiptsCount > 0 ? totalSpent / receiptsCount : 0;
    return {
      totalSpent,
      totalSaved,
      itemsCount,
      receiptsCount,
      largestReceipt,
      averageReceipt,
    };
  }, [filteredReceipts, categoryFilter]);

  const timelineData = useMemo(() => {
    if (!monthFilter) return [] as { label: string; value: number }[];
    if (monthFilter === "all") {
      const monthlyMap = new Map<string, number>();
      filteredReceipts.forEach((receipt) => {
        const date = new Date(receipt.purchasedAt || receipt.createdAt);
        if (Number.isNaN(date.getTime())) return;
        const monthKey = getMonthKey(date);
        const items = categoryFilter === "all"
          ? receipt.items
          : receipt.items.filter((item) => item.category === categoryFilter);
        const monthTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        if (monthTotal === 0) return;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + monthTotal);
      });

      const sorted = Array.from(monthlyMap.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
      const years = new Set(sorted.map(([month]) => month.split("-")[0]));
      const includeYear = years.size > 1;
      return sorted.map(([month, value]) => ({
        label: formatMonthAxisLabel(month, locale, includeYear),
        value,
      }));
    }

    const dailyMap = new Map<string, number>();
    filteredReceipts.forEach((receipt) => {
      const date = new Date(receipt.purchasedAt || receipt.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const dayKey = getDayKey(date);
      const items = categoryFilter === "all"
        ? receipt.items
        : receipt.items.filter((item) => item.category === categoryFilter);
      const dayTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      if (dayTotal === 0) return;
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + dayTotal);
    });

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([day, value]) => ({
        label: day.split("-")[2],
        value,
      }));
  }, [filteredReceipts, monthFilter, categoryFilter, locale]);

  const categoryData = useMemo(() => {
    const totals = new Map<Category, number>();
    categories.forEach((category) => totals.set(category, 0));

    filteredReceipts.forEach((receipt) => {
      receipt.items.forEach((item) => {
        if (categoryFilter !== "all" && item.category !== categoryFilter) return;
        totals.set(item.category, (totals.get(item.category) ?? 0) + item.totalPrice);
      });
    });

    return categories
      .map((category) => ({
        label: t(`categories.${category}`),
        value: totals.get(category) ?? 0,
        color: categoryPalette[category],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredReceipts, categoryFilter, t]);

  const monthLabel =
    monthFilter === "all" ? t("dashboard.filters.allMonths") : formatMonthLabel(monthFilter, locale);
  const timelineTitle =
    monthFilter === "all" ? t("dashboard.charts.monthly") : t("dashboard.charts.daily");

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-3">
        <select
          className="filter-pill w-full sm:w-auto"
          value={monthFilter}
          onChange={(event) => {
            setMonthFilter(event.target.value);
            setHasManualMonth(true);
          }}
        >
          <option value="all">{t("dashboard.filters.allMonths")}</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month, locale)}
            </option>
          ))}
        </select>
        <select
          className="filter-pill w-full sm:w-auto"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">{t("dashboard.filters.allCategories")}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
        <select
          className="filter-pill w-full sm:w-auto"
          value={storeFilter}
          onChange={(event) => setStoreFilter(event.target.value)}
        >
          <option value="all">{t("dashboard.filters.allStores")}</option>
          {stores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t("dashboard.cards.totalSpent")}
          value={formatMoney(metrics.totalSpent, "CZK", locale)}
          hint={`${metrics.receiptsCount} ${t("dashboard.hints.receipts")}`}
          href="/receipts"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7l5 5 4-4 7 7" />
              <path d="M20 15v4h-4" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.cards.savedThisMonth")}
          value={formatMoney(metrics.totalSaved, "CZK", locale)}
          hint={t("dashboard.hints.savedOnDiscounts")}
          href="/receipts"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17l6-6 4 4 6-6" />
              <path d="M20 7v4h-4" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.cards.items")}
          value={metrics.itemsCount.toString()}
          hint={t("dashboard.hints.itemsHistory")}
          href="/items"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12z" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
            </svg>
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{timelineTitle}</h2>
            <span className="text-xs text-slate-400">{monthLabel}</span>
          </div>
          <div className="mt-4">
            {timelineData.length ? (
              <LineChart data={timelineData} />
            ) : (
              <p className="text-sm text-slate-500">{t("general.noData")}</p>
            )}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.charts.categories")}</h2>
          <div className="mt-4">
            {categoryData.length ? (
              <DonutChart
                data={categoryData}
                totalLabel={t("receipts.total")}
                totalValue={formatMoney(metrics.totalSpent, "CZK", locale)}
                formatValue={(value) => formatMoney(value, "CZK", locale)}
              />
            ) : (
              <p className="text-sm text-slate-500">{t("general.noData")}</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface p-6">
          <h3 className="text-sm font-semibold text-slate-500">{t("dashboard.charts.savingsRate")}</h3>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {metrics.totalSpent + metrics.totalSaved > 0
                  ? `${Math.round((metrics.totalSaved / (metrics.totalSpent + metrics.totalSaved)) * 100)}%`
                  : "0%"}
              </p>
              <p className="text-xs text-slate-400">{t("dashboard.stats.savedTotal")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{t("dashboard.cards.averageReceipt")}</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatMoney(metrics.averageReceipt, "CZK", locale)}
              </p>
            </div>
          </div>
        </div>

        <div className="surface p-6">
          <h3 className="text-sm font-semibold text-slate-500">{t("dashboard.stats.largestReceipt")}</h3>
          <p className="mt-4 text-2xl font-semibold text-slate-900">
            {formatMoney(metrics.largestReceipt, "CZK", locale)}
          </p>
          <p className="mt-2 text-xs text-slate-400">{t("dashboard.cards.receipts")}: {metrics.receiptsCount}</p>
        </div>
      </section>
    </div>
  );
}
