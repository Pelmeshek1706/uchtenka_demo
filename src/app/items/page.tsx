"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ItemsPage() {
  const { t, locale } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setProducts((data.products as Product[]) ?? []);
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
    const unique = new Set(products.map((product) => product.store).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesStore = storeFilter === "all" ? true : product.store === storeFilter;
        const matchesQuery = lowerQuery
          ? `${product.rawName} ${product.name}`.toLowerCase().includes(lowerQuery)
          : true;
        return matchesStore && matchesQuery;
      })
      .sort((a, b) => {
        const storeCompare = a.store.localeCompare(b.store);
        if (storeCompare !== 0) return storeCompare;
        return a.name.localeCompare(b.name);
      });
  }, [products, storeFilter, query]);

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <h1 className="section-title">{t("items.title")}</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="input"
            placeholder={t("filters.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="input"
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
      ) : filteredProducts.length === 0 ? (
        <div className="surface p-6">
          <p className="text-sm text-slate-500">{t("items.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/items/${product.id}`} className="surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{product.rawName}</p>
                  <p className="text-lg font-semibold">{product.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">{product.store}</span>
                    <span className="chip">{t(`categories.${product.category}`)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{t("items.lastPrice")}</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(product.lastPrice, "CZK", locale)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
