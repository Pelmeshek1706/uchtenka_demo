"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { cx } from "@/lib/utils";

const navItems = [
  { href: "/", key: "nav.dashboard" },
  { href: "/scan", key: "nav.scan" },
  { href: "/receipts", key: "nav.receipts" },
  { href: "/items", key: "nav.items" },
];
const accentPresets = [
  { name: "Violet", value: "#6a5cff" },
  { name: "Azure", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Coral", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  const [accent, setAccent] = useState("#6a5cff");

  useEffect(() => {
    const saved = window.localStorage.getItem("uchtenka-accent");
    if (saved) {
      setAccent(saved);
      applyAccent(saved);
    } else {
      applyAccent(accent);
    }
  }, []);

  function normalizeHex(value: string) {
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    return "#6a5cff";
  }

  function hexToRgb(value: string) {
    const normalized = normalizeHex(value).slice(1);
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function darken(value: string, amount: number) {
    const { r, g, b } = hexToRgb(value);
    const scale = 1 - amount;
    return rgbToHex({
      r: Math.max(0, Math.round(r * scale)),
      g: Math.max(0, Math.round(g * scale)),
      b: Math.max(0, Math.round(b * scale)),
    });
  }

  function lighten(value: string, amount: number) {
    const { r, g, b } = hexToRgb(value);
    return rgbToHex({
      r: Math.min(255, Math.round(r + (255 - r) * amount)),
      g: Math.min(255, Math.round(g + (255 - g) * amount)),
      b: Math.min(255, Math.round(b + (255 - b) * amount)),
    });
  }

  function applyAccent(value: string) {
    const normalized = normalizeHex(value);
    const { r, g, b } = hexToRgb(normalized);
    const root = document.documentElement;
    root.style.setProperty("--accent", normalized);
    root.style.setProperty("--accent-strong", darken(normalized, 0.15));
    root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.18)`);
    root.style.setProperty("--accent-soft-border", `rgba(${r}, ${g}, ${b}, 0.35)`);
    root.style.setProperty("--accent-bg-1", darken(normalized, 0.15));
    root.style.setProperty("--accent-bg-2", normalized);
    root.style.setProperty("--accent-bg-3", lighten(normalized, 0.2));
  }

  function handleAccentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setAccent(value);
    applyAccent(value);
    window.localStorage.setItem("uchtenka-accent", value);
  }

  function handlePreset(value: string) {
    setAccent(value);
    applyAccent(value);
    window.localStorage.setItem("uchtenka-accent", value);
  }

  return (
    <header className="mx-auto w-full max-w-6xl px-4 pb-4 pt-4 sm:px-6">
      <div className="header-shell px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-amber-700">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 4h10l1 6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5l1-6z" />
                  <path d="M8 20h8" />
                  <path d="M9 8h6" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{t("app.name")}</div>
                <p className="text-xs text-white/70">{t("app.tagline")}</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <select
                className="filter-pill w-full sm:w-auto"
                value={locale}
                onChange={(event) => setLocale(event.target.value as typeof locale)}
              >
                <option value="en">English</option>
                <option value="uk">Українська</option>
              </select>
              <div className="accent-controls w-full sm:w-auto">
                <label className="accent-picker">
                  <span className="text-xs font-semibold text-white/80">{t("app.accent")}</span>
                  <input
                    aria-label={t("app.accent")}
                    type="color"
                    value={accent}
                    onChange={handleAccentChange}
                  />
                </label>
                <div className="accent-presets">
                  <span className="text-[11px] font-semibold text-white/70">{t("app.presets")}</span>
                  <div className="accent-swatches">
                    {accentPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className="accent-swatch"
                        style={{ background: preset.value }}
                        aria-label={preset.name}
                        onClick={() => handlePreset(preset.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Link href="/scan" className="button secondary w-full sm:w-auto">
                + {t("nav.scan")}
              </Link>
            </div>
          </div>

          <nav className="nav-strip" aria-label="Primary">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx("nav-link", active && "active")}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
