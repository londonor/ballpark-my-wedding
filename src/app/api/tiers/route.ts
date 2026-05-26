import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const destinationId = searchParams.get("destinationId");
    const category      = searchParams.get("category");

    if (!destinationId) {
      return NextResponse.json({ error: "destinationId is required" }, { status: 400 });
    }

    const where: { destinationId: number; category?: string } = {
      destinationId: parseInt(destinationId),
    };
    if (category) where.category = category;

    const tiers = await prisma.tier.findMany({
      where,
      orderBy: { tierOrder: "asc" },
      include: { examples: { orderBy: { displayOrder: "asc" } } },
    });

    return NextResponse.json(tiers);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/tiers] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
