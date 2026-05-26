import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInsight } from "@/lib/llmService";
import type { WeddingEstimateResult } from "@/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const report = await prisma.report.findUnique({ where: { shareToken: token } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Return cached insight
  if (report.insight) {
    return NextResponse.json({
      insight: report.insight,
      cached: true,
      model: report.insightModel,
      generatedAt: report.insightGeneratedAt,
    });
  }

  let result: WeddingEstimateResult;
  try {
    result = JSON.parse(report.reportData) as WeddingEstimateResult;
  } catch {
    return NextResponse.json({ error: "Corrupt report data" }, { status: 500 });
  }

  // Build alternative cities list (all other 20 cities)
  const alternatives = await prisma.destination.findMany({
    where: { city: { not: result.city } },
    select: { city: true, state: true },
  });
  const alternativeCities = alternatives.map((d) => `${d.city}, ${d.state}`);

  try {
    const { text, model } = await generateInsight({ result, alternativeCities });

    await prisma.report.update({
      where: { id: report.id },
      data: {
        insight: text,
        insightGeneratedAt: new Date(),
        insightModel: model,
      },
    });

    return NextResponse.json({ insight: text, cached: false, model });
  } catch (err: unknown) {
    console.error("[insight] LLM generation failed:", err);
    return NextResponse.json({ error: "Insight unavailable" }, { status: 503 });
  }
}
