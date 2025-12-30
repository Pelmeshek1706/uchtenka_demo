import { NextResponse } from "next/server";
import { computeStats } from "@/server/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ stats: computeStats() });
}
