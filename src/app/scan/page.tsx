"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate, formatMoney } from "@/lib/format";
import { categories, type Category, type OcrReceipt, type Receipt } from "@/lib/types";

const unitOptions = ["pcs", "pack", "kg", "g", "l", "m"] as const;

type UnitOption = (typeof unitOptions)[number];

type DraftItem = {
  id: string;
  raw_name: string;
  name: string;
  category: Category;
  quantity: number;
  unit: UnitOption;
  unit_price: number;
  total_price: number;
  discount: number;
};

type DraftReceipt = {
  store: { name: string | null; address: string | null } | null;
  purchased_at: string | null;
  currency: string | null;
  items: DraftItem[];
  totals: {
    subtotal: number;
    discount_items: number;
    discount_receipt: number;
    discount: number;
    total: number;
    payment_method: string | null;
  };
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeUnit(value: string): UnitOption {
  const lowered = value.toLowerCase();
  if (/(kg|кг)/.test(lowered)) return "kg";
  if (/(g|г)/.test(lowered)) return "g";
  if (/(l|л)/.test(lowered)) return "l";
  if (/(pcs|шт|ks|pc)/.test(lowered)) return "pcs";
  if (/(pack|уп)/.test(lowered)) return "pack";
  if (/(m|м)/.test(lowered)) return "m";
  return "pcs";
}

function normalizeDateInput(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const match = trimmed.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function extractBase64FromDataUrl(dataUrl: string | null) {
  if (!dataUrl) return null;
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return null;
  return dataUrl.slice(commaIndex + 1);
}

function createDraftFromOcr(raw: unknown): DraftReceipt {
  const source = (raw ?? {}) as any;
  const storeName = toText(source?.store?.name) || toText(source?.store);
  const storeAddress = toText(source?.store?.address);
  const itemsRaw = Array.isArray(source?.items) ? source.items : [];

  const items: DraftItem[] = itemsRaw
    .map((item: any) => {
      const rawName = toText(item?.raw_name) || toText(item?.name);
      const name = toText(item?.name) || rawName || "Unknown item";
      if (!rawName && !name) return null;
      const quantity = toNumber(item?.quantity, 1);
      const unitPrice = toNumber(item?.unit_price, 0);
      const discount = toNumber(item?.discount, 0);
      const totalFallback = Math.max(0, quantity * unitPrice - discount);
      const totalPrice = toNumber(item?.total_price, totalFallback);
      const categoryValue = categories.includes(item?.category)
        ? (item?.category as Category)
        : "other";
      const unitValue = normalizeUnit(toText(item?.unit));

      return {
        id: createId(),
        raw_name: rawName,
        name,
        category: categoryValue,
        quantity,
        unit: unitValue,
        unit_price: unitPrice,
        total_price: totalPrice,
        discount,
      };
    })
    .filter(Boolean) as DraftItem[];

  const computedSubtotal = round2(
    items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  );
  const computedDiscountItems = round2(items.reduce((sum, item) => sum + item.discount, 0));
  const subtotal = round2(toNumber(source?.totals?.subtotal, computedSubtotal));
  const discountItems = round2(toNumber(source?.totals?.discount_items, computedDiscountItems));
  const discountReceipt = round2(toNumber(source?.totals?.discount_receipt, 0));
  const discount = round2(toNumber(source?.totals?.discount, discountItems + discountReceipt));
  const total = round2(toNumber(source?.totals?.total, subtotal - discount));

  return {
    store: {
      name: storeName || null,
      address: storeAddress || null,
    },
    purchased_at: normalizeDateInput(toText(source?.purchased_at)) || null,
    currency: toText(source?.currency) || "CZK",
    items,
    totals: {
      subtotal,
      discount_items: discountItems,
      discount_receipt: discountReceipt,
      discount,
      total,
      payment_method: toText(source?.totals?.payment_method) || null,
    },
  };
}

function createDraftFromReceipt(receipt: Receipt): DraftReceipt {
  const items: DraftItem[] = receipt.items.map((item) => ({
    id: item.id || createId(),
    raw_name: item.rawName,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: normalizeUnit(item.unit),
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    discount: item.discount,
  }));

  const discountItems = receipt.totals.discountItems ?? 0;
  const discountReceipt = receipt.totals.discountReceipt ?? 0;

  return {
    store: {
      name: receipt.store || null,
      address: null,
    },
    purchased_at: normalizeDateInput(receipt.purchasedAt) || null,
    currency: receipt.currency || "CZK",
    items,
    totals: {
      subtotal: receipt.totals.subtotal,
      discount_items: discountItems,
      discount_receipt: discountReceipt,
      discount: receipt.totals.discount,
      total: receipt.totals.total,
      payment_method: receipt.totals.paymentMethod ?? null,
    },
  };
}

function createBlankItem(): DraftItem {
  return {
    id: createId(),
    raw_name: "",
    name: "",
    category: "other",
    quantity: 1,
    unit: "pcs",
    unit_price: 0,
    total_price: 0,
    discount: 0,
  };
}

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLocale();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftReceipt | null>(null);
  const [scanData, setScanData] = useState<OcrReceipt | null>(null);
  const [pendingScan, setPendingScan] = useState<OcrReceipt | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const editReceiptId = searchParams.get("edit");

  function markDirty() {
    if (hasSaved) setHasSaved(false);
  }

  useEffect(() => {
    if (!editReceiptId) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setDraft(null);
    setScanData(null);
    setPendingScan(null);
    setPreviewUrl(null);
    setImageBase64(null);
    setFileName(null);
    setSavedReceipt(null);
    setHasSaved(false);
    setIsEditing(false);
    fetch(`/api/receipts/${editReceiptId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.receipt) {
          const receipt = data.receipt as Receipt;
          setDraft(createDraftFromReceipt(receipt));
          setScanData(receipt.scan ?? null);
          const storedImage = receipt.imageDataUrl ?? null;
          setPreviewUrl(storedImage);
          setImageBase64(extractBase64FromDataUrl(storedImage));
        } else {
          setError(t("scan.failure"));
        }
      })
      .catch(() => {
        if (isMounted) setError(t("scan.failure"));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [editReceiptId, t]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSavedReceipt(null);
    setHasSaved(false);
    setPendingScan(null);
    if (!editReceiptId) {
      setDraft(null);
      setScanData(null);
      setIsEditing(false);
    }
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setPreviewUrl(result);
      setImageBase64(base64 || null);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imageBase64) return;
    const hadDraft = Boolean(draft);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to analyze");
      }
      const data = await response.json();
      const parsed = data?.draft ?? data?.receipt ?? data;
      setScanData(parsed as OcrReceipt);
      if (hadDraft) {
        setPendingScan(parsed as OcrReceipt);
      } else {
        setDraft(createDraftFromOcr(parsed));
        setPendingScan(null);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scan.failure"));
    } finally {
      setIsLoading(false);
    }
  }

  function applyPendingScan() {
    if (!pendingScan) return;
    setDraft(createDraftFromOcr(pendingScan));
    setScanData(pendingScan);
    setPendingScan(null);
    markDirty();
  }

  function discardPendingScan() {
    setPendingScan(null);
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    setError(null);
    try {
      const latestScan = pendingScan ?? scanData;
      const payload = {
        ...draft,
        imageDataUrl: previewUrl ?? undefined,
        scan: latestScan ?? undefined,
      };
      const response = await fetch(editReceiptId ? `/api/receipts/${editReceiptId}` : "/api/receipts", {
        method: editReceiptId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: payload }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to save");
      }
      const data = await response.json();
      setSavedReceipt(data.receipt as Receipt);
      setHasSaved(true);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scan.failure"));
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraftField(field: "currency" | "purchased_at", value: string) {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      return { ...current, [field]: value || null };
    });
  }

  function updateStore(field: "name" | "address", value: string) {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      return {
        ...current,
        store: {
          name: current.store?.name ?? null,
          address: current.store?.address ?? null,
          [field]: value || null,
        },
      };
    });
  }

  function updateTotals(field: keyof DraftReceipt["totals"], value: string) {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      if (field === "payment_method") {
        return {
          ...current,
          totals: {
            ...current.totals,
            payment_method: value || null,
          },
        };
      }
      return {
        ...current,
        totals: {
          ...current.totals,
          [field]: toNumber(value, 0),
        },
      };
    });
  }

  function updateItem(id: string, field: keyof DraftItem, value: string) {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      const updatedItems = current.items.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          return { ...item, category: value as Category };
        }
        if (field === "unit") {
          return { ...item, unit: value as UnitOption };
        }
        if (field === "quantity" || field === "unit_price" || field === "discount") {
          const numericValue = toNumber(value, 0);
          const updated = { ...item, [field]: numericValue } as DraftItem;
          const recalculated = Math.max(
            0,
            round2(updated.quantity * updated.unit_price - updated.discount)
          );
          return { ...updated, total_price: recalculated };
        }
        if (field === "total_price") {
          return { ...item, total_price: toNumber(value, 0) };
        }
        return { ...item, [field]: value } as DraftItem;
      });

      return { ...current, items: updatedItems };
    });
  }

  function addItem() {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      return { ...current, items: [createBlankItem(), ...current.items] };
    });
  }

  function removeItem(id: string) {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      return { ...current, items: current.items.filter((item) => item.id !== id) };
    });
  }

  function recalculateTotals() {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      const subtotal = round2(
        current.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
      );
      const discountItems = round2(current.items.reduce((sum, item) => sum + item.discount, 0));
      const discountReceipt = current.totals.discount_receipt || 0;
      const discount = round2(discountItems + discountReceipt);
      const total = round2(subtotal - discount);
      return {
        ...current,
        totals: {
          ...current.totals,
          subtotal,
          discount_items: discountItems,
          discount_receipt: discountReceipt,
          discount,
          total,
        },
      };
    });
  }

  const summaryCurrency = draft?.currency ?? "CZK";
  const summaryStore = draft?.store?.name || t("general.noData");
  const summaryDate = draft?.purchased_at
    ? formatDate(draft.purchased_at, locale)
    : t("general.noData");

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <h1 className="section-title">{t("scan.title")}</h1>
        <p className="mt-2 text-sm text-slate-500">{t("scan.hint")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="surface p-6">
          <div className="upload-card">
            <div className="upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <path d="M8 10h8" />
                <path d="M8 14h6" />
              </svg>
            </div>
            <div className="upload-meta">
              <p className="text-sm font-semibold text-slate-700">{t("scan.uploadLabel")}</p>
              <p className="text-xs text-slate-500">{t("scan.uploadHint")}</p>
              {fileName ? (
                <p className="upload-file">
                  {t("scan.fileSelected")} <span className="font-medium text-slate-700">{fileName}</span>
                </p>
              ) : null}
            </div>
            <div className="flex w-full items-center sm:w-auto">
              <label htmlFor="receipt-file" className="button secondary upload-button w-full sm:w-auto">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                {t("scan.upload")}
              </label>
              <input
                id="receipt-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
          </div>
          {previewUrl ? (
            <div className="upload-preview mt-4">
              <img src={previewUrl} alt="Receipt preview" className="w-full object-cover" />
            </div>
          ) : null}

          <button
            className="button mt-4 w-full sm:w-auto"
            onClick={handleAnalyze}
            disabled={!imageBase64 || isLoading}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                {t("scan.processing")}
              </>
            ) : (
              t("scan.analyze")
            )}
          </button>

          {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
        </div>

        <div className="surface flex h-full flex-col gap-6 p-6">
          {pendingScan ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">{t("scan.ocrReady")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="button" type="button" onClick={applyPendingScan}>
                  {t("scan.applyOcr")}
                </button>
                <button className="button secondary" type="button" onClick={discardPendingScan}>
                  {t("scan.keepDraft")}
                </button>
              </div>
            </div>
          ) : null}
          {draft ? (
            isEditing ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t("scan.detailsTitle")}</h2>
                  <div className="flex items-center gap-2">
                    <button className="button secondary" onClick={recalculateTotals}>
                      {t("scan.recalculate")}
                    </button>
                    <button className="button secondary" onClick={() => setIsEditing(false)}>
                      {t("scan.closeEdit")}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  {hasSaved ? t("scan.success") : t("scan.review")}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500">{t("scan.storeLabel")}</label>
                    <input
                      className="input mt-1"
                      value={draft.store?.name ?? ""}
                      onChange={(event) => updateStore("name", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">{t("scan.dateLabel")}</label>
                    <input
                      type="date"
                      className="input mt-1"
                      value={draft.purchased_at ?? ""}
                      onChange={(event) => updateDraftField("purchased_at", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">{t("scan.currencyLabel")}</label>
                    <input
                      className="input mt-1"
                      value={draft.currency ?? ""}
                      onChange={(event) => updateDraftField("currency", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">{t("scan.paymentMethodLabel")}</label>
                    <input
                      className="input mt-1"
                      value={draft.totals.payment_method ?? ""}
                      onChange={(event) => updateTotals("payment_method", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-600">{t("scan.totalsTitle")}</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500">{t("scan.subtotalLabel")}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1"
                        value={draft.totals.subtotal}
                        onChange={(event) => updateTotals("subtotal", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">{t("scan.discountItemsLabel")}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1"
                        value={draft.totals.discount_items}
                        onChange={(event) => updateTotals("discount_items", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">{t("scan.discountReceiptLabel")}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1"
                        value={draft.totals.discount_receipt}
                        onChange={(event) => updateTotals("discount_receipt", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">{t("scan.discountTotalLabel")}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1"
                        value={draft.totals.discount}
                        onChange={(event) => updateTotals("discount", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">{t("scan.totalLabel")}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1"
                        value={draft.totals.total}
                        onChange={(event) => updateTotals("total", event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-600">{t("scan.itemsTitle")}</h3>
                  <button className="button secondary" onClick={addItem}>
                    {t("scan.addItem")}
                  </button>
                </div>

                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
                  {draft.items.length === 0 ? (
                    <p className="text-sm text-slate-500">{t("general.noData")}</p>
                  ) : (
                    draft.items.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-medium text-slate-500">{t("scan.rawNameLabel")}</label>
                          <button
                            className="text-xs font-semibold text-rose-500"
                            onClick={() => removeItem(item.id)}
                            type="button"
                          >
                            {t("scan.removeItem")}
                          </button>
                        </div>
                        <input
                          className="input mt-1"
                          value={item.raw_name}
                          onChange={(event) => updateItem(item.id, "raw_name", event.target.value)}
                        />

                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.nameLabel")}</label>
                            <input
                              className="input mt-1"
                              value={item.name}
                              onChange={(event) => updateItem(item.id, "name", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.categoryLabel")}</label>
                            <select
                              className="input mt-1"
                              value={item.category}
                              onChange={(event) => updateItem(item.id, "category", event.target.value)}
                            >
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {t(`categories.${category}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.quantityLabel")}</label>
                            <input
                              type="number"
                              step="0.001"
                              className="input mt-1"
                              value={item.quantity}
                              onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.unitLabel")}</label>
                            <select
                              className="input mt-1"
                              value={item.unit}
                              onChange={(event) => updateItem(item.id, "unit", event.target.value)}
                            >
                              {unitOptions.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.unitPriceLabel")}</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input mt-1"
                              value={item.unit_price}
                              onChange={(event) => updateItem(item.id, "unit_price", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.discountLabel")}</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input mt-1"
                              value={item.discount}
                              onChange={(event) => updateItem(item.id, "discount", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">{t("scan.lineTotalLabel")}</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input mt-1"
                              value={item.total_price}
                              onChange={(event) => updateItem(item.id, "total_price", event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                <button className="button w-full sm:w-auto" onClick={handleSave} disabled={isSaving || hasSaved}>
                  {isSaving ? t("scan.saving") : t("scan.save")}
                </button>
                  {savedReceipt ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip">
                        {formatMoney(savedReceipt.totals.total, savedReceipt.currency, locale)}
                      </span>
                      <span className="chip">{formatDate(savedReceipt.purchasedAt, locale)}</span>
                    </div>
                  ) : null}
                </div>

                {savedReceipt ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href="/receipts" className="button secondary w-full sm:w-auto">
                      {t("scan.viewReceipts")}
                    </Link>
                    <button className="button w-full sm:w-auto" onClick={() => router.push("/items")}
                    >
                      {t("nav.items")}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t("scan.summaryTitle")}</h2>
                  <button className="button secondary" onClick={() => setIsEditing(true)}>
                    {t("scan.edit")}
                  </button>
                </div>

                <p className="text-sm text-slate-500">
                  {hasSaved ? t("scan.success") : t("scan.review")}
                </p>

                <div className="space-y-2">
                  <div className="chip">{summaryStore}</div>
                  <p className="text-sm text-slate-500">{summaryDate}</p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(draft.totals.total, summaryCurrency, locale)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {draft.items.length} {t("receipts.items")}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">{t("scan.subtotalLabel")}</p>
                    <p className="text-sm font-semibold">
                      {formatMoney(draft.totals.subtotal, summaryCurrency, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t("scan.discountItemsLabel")}</p>
                    <p className="text-sm font-semibold">
                      {formatMoney(draft.totals.discount_items, summaryCurrency, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t("scan.discountReceiptLabel")}</p>
                    <p className="text-sm font-semibold">
                      {formatMoney(draft.totals.discount_receipt, summaryCurrency, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t("scan.discountTotalLabel")}</p>
                    <p className="text-sm font-semibold">
                      {formatMoney(draft.totals.discount, summaryCurrency, locale)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-600">{t("scan.previewTitle")}</h3>
                  {draft.items.length ? (
                    <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-2">
                      {draft.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.raw_name}</p>
                            <p className="text-xs text-slate-500">{item.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatMoney(item.total_price, summaryCurrency, locale)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.quantity} {item.unit} · {formatMoney(item.unit_price, summaryCurrency, locale)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">{t("general.noData")}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                <button className="button w-full sm:w-auto" onClick={handleSave} disabled={isSaving || hasSaved}>
                  {isSaving ? t("scan.saving") : t("scan.save")}
                </button>
                  {savedReceipt ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip">
                        {formatMoney(savedReceipt.totals.total, savedReceipt.currency, locale)}
                      </span>
                      <span className="chip">{formatDate(savedReceipt.purchasedAt, locale)}</span>
                    </div>
                  ) : null}
                </div>

                {savedReceipt ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href="/receipts" className="button secondary w-full sm:w-auto">
                      {t("scan.viewReceipts")}
                    </Link>
                    <button className="button w-full sm:w-auto" onClick={() => router.push("/items")}
                    >
                      {t("nav.items")}
                    </button>
                  </div>
                ) : null}
              </>
            )
          ) : isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="h-8 w-32 rounded-2xl bg-slate-100" />
              <div className="h-4 w-40 rounded-full bg-slate-100" />
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("scan.previewEmpty")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
