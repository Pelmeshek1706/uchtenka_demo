"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate, formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/items/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setProduct(data.product as Product);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const priceValues = useMemo(() => {
    return product?.priceHistory.map((point) => point.price) ?? [];
  }, [product]);

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/items");
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">{t("general.loading")}</p>;
  }

  if (!product) {
    return (
      <div className="surface p-6">
        <p className="text-sm text-slate-500">{t("general.noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <button className="button secondary" onClick={handleBack}>
          {t("items.back")}
        </button>
        <h1 className="section-title mt-4">{product.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{product.rawName}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">{product.store}</span>
          <span className="chip">{t(`categories.${product.category}`)}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="surface p-6">
          <h2 className="text-lg font-semibold">{t("items.history")}</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <Sparkline values={priceValues} />
          </div>
          <div className="mt-4 space-y-3">
            {product.priceHistory.map((point) => (
              <div key={`${point.date}-${point.price}`} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">{formatDate(point.date, locale)}</span>
                <span className="text-sm font-semibold">{formatMoney(point.price, "CZK", locale)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold">{t("items.lastPrice")}</h2>
          <p className="mt-3 text-3xl font-semibold">
            {formatMoney(product.lastPrice, "CZK", locale)}
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("items.store")}: {product.store}</p>
        </div>
      </div>
    </div>
  );
}
