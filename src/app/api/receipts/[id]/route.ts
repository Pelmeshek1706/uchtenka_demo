import { NextResponse } from "next/server";
import { deleteReceipt, getReceipt, updateReceipt } from "@/server/receipts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const receipt = getReceipt(params.id);
  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ receipt });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { receipt?: unknown };
    if (!body?.receipt) {
      return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
    }
    const updated = updateReceipt(params.id, body.receipt);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ receipt: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ok = deleteReceipt(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
