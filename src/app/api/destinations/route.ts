import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Canonical display order for the 20 wedding cities
const CITY_ORDER = [
  "New York City", "Los Angeles", "Chicago", "San Francisco", "Boston",
  "Washington DC", "Philadelphia", "Miami", "Atlanta", "Dallas",
  "Phoenix", "Minneapolis", "Seattle", "Denver", "Austin",
  "Nashville", "New Orleans", "Charleston", "Savannah", "Asheville",
];

export async function GET() {
  try {
    const destinations = await prisma.destination.findMany();

    // Sort by canonical order; anything not in the list sorts to the end alphabetically
    destinations.sort((a, b) => {
      const ai = CITY_ORDER.indexOf(a.city);
      const bi = CITY_ORDER.indexOf(b.city);
      if (ai === -1 && bi === -1) return a.city.localeCompare(b.city);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return NextResponse.json(destinations);
  } catch (error) {
    console.error("[API /destinations] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
