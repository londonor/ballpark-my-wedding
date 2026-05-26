import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const shareToken = nanoid(12);

  const report = await prisma.report.create({
    data: { shareToken, reportData: JSON.stringify(body) },
  });

  return NextResponse.json({ shareToken: report.shareToken });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { shareToken: token } });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ ...report, reportData: JSON.parse(report.reportData) });
}
