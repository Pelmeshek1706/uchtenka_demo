import { NextResponse } from "next/server";
import { readDb } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { receipts, products } = readDb();
  const stores = new Set<string>();
  for (const receipt of receipts) {
    if (receipt.store) stores.add(receipt.store);
  }
  for (const product of products) {
    if (product.store) stores.add(product.store);
  }
  return NextResponse.json({ stores: Array.from(stores).sort() });
}
