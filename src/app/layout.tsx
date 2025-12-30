import type { Metadata } from "next";
import { IBM_Plex_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";

const display = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Uchtenka",
  description: "Receipt-first budget tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <LocaleProvider>
          <div className="app-shell">
            <SiteHeader />
            <main className="page-enter mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
              {children}
            </main>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
