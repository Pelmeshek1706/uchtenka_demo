import { NextResponse } from "next/server";
import { addReceiptFromOcr, getReceipts } from "@/server/receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ receipts: getReceipts() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { receipt?: unknown };
    if (!body?.receipt) {
      return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
    }
    const receipt = addReceiptFromOcr(body.receipt);
    return NextResponse.json({ receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
