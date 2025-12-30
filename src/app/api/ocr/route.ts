import { NextResponse } from "next/server";
import { OCR_service } from "@/server/ocrService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageBase64?: string };
    if (!body?.imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const parsed = await OCR_service.analyzeReceipt(body.imageBase64);
    return NextResponse.json({ draft: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
