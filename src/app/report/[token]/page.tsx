import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SharedReportClient } from "./SharedReportClient";
import type { Metadata } from "next";
import type { WeddingEstimateResult } from "@/types";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { shareToken: token } });

  if (!report) return { title: "Report Not Found" };

  const data: WeddingEstimateResult = JSON.parse(report.reportData);

  return {
    title: `Wedding Estimate: ${data.city}, ${data.state} — Ballpark My Wedding`,
    description: `A curated wedding cost estimate for ${data.city}, ${data.state}. See the full breakdown and build your own.`,
    openGraph: {
      images: [`/images/destinations/${data.slug}/banner/1.png`],
    },
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { shareToken: token } });

  if (!report) notFound();

  const result: WeddingEstimateResult = JSON.parse(report.reportData);

  return <SharedReportClient result={result} insight={report.insight} />;
}
