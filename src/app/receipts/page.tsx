"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate, formatMoney } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export default function ReceiptsPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/receipts")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setReceipts((data.receipts as Receipt[]) ?? []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const stores = useMemo(() => {
    const unique = new Set(receipts.map((receipt) => receipt.store).filter(Boolean));
    return Array.from(unique).sort();
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => (storeFilter === "all" ? true : receipt.store === storeFilter));
  }, [receipts, storeFilter]);

  async function handleDelete(id: string) {
    if (!window.confirm(t("receipts.confirmDelete"))) return;
    try {
      const response = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      if (!response.ok) return;
      setReceipts((current) => current.filter((receipt) => receipt.id !== id));
      setMenuOpenId(null);
    } catch {
      setMenuOpenId(null);
    }
  }

  function handleEdit(id: string) {
    setMenuOpenId(null);
    router.push(`/scan?edit=${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <h1 className="section-title">{t("receipts.title")}</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm text-slate-500">{t("filters.store")}</label>
          <select
            className="input w-auto"
            value={storeFilter}
            onChange={(event) => setStoreFilter(event.target.value)}
          >
            <option value="all">{t("filters.allStores")}</option>
            {stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("general.loading")}</p>
      ) : filteredReceipts.length === 0 ? (
        <div className="surface p-6">
          <p className="text-sm text-slate-500">{t("receipts.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReceipts.map((receipt) => (
            <div key={receipt.id} className="surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="badge">{receipt.store}</div>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(receipt.purchasedAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{t("receipts.total")}</p>
                    <p className="text-xl font-semibold">
                      {formatMoney(receipt.totals.total, receipt.currency, locale)}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      className="button secondary px-3"
                      onClick={() => setMenuOpenId(menuOpenId === receipt.id ? null : receipt.id)}
                      type="button"
                      aria-label="Receipt actions"
                    >
                      ...
                    </button>
                    {menuOpenId === receipt.id ? (
                      <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => handleEdit(receipt.id)}
                          type="button"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 20h4l10-10-4-4L4 16v4z" />
                            <path d="M13 6l4 4" />
                          </svg>
                          {t("receipts.edit")}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(receipt.id)}
                          type="button"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M6 6l1 14h10l1-14" />
                          </svg>
                          {t("receipts.delete")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-400">{t("receipts.items")}</p>
                  <p className="text-sm font-semibold">{receipt.items.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t("receipts.subtotal")}</p>
                  <p className="text-sm font-semibold">
                    {formatMoney(receipt.totals.subtotal, receipt.currency, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t("receipts.discount")}</p>
                  <p className="text-sm font-semibold">
                    {formatMoney(receipt.totals.discount, receipt.currency, locale)}
                  </p>
                </div>
              </div>
              {receipt.totals.paymentMethod ? (
                <p className="mt-3 text-xs text-slate-400">
                  {t("receipts.payment")}: {receipt.totals.paymentMethod}
                </p>
              ) : null}

              <div className="mt-4 space-y-2">
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <div>
                      <p className="text-sm font-medium">{item.rawName}</p>
                      <p className="text-xs text-slate-500">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatMoney(item.totalPrice, receipt.currency, locale)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.quantity} {item.unit} · {formatMoney(item.unitPrice, receipt.currency, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
