import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const destinations = await prisma.destination.findMany();
    destinations.sort((a, b) => a.city.localeCompare(b.city));
    return NextResponse.json(destinations);
  } catch (error) {
    console.error("[API /destinations] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
