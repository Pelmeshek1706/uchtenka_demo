import { NextResponse } from "next/server";
import { getProducts } from "@/server/receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ products: getProducts() });
}
