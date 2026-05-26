import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { generateReportPdf, buildPdfFilename } from "@/lib/generateReport";
import { buildShareEmail } from "@/lib/emailTemplates/shareEmail";
import type { WeddingEstimateResult } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  let shareToken: string;
  let senderName: string;
  let message: string | undefined;
  let recipients: string[];

  try {
    const body = await request.json();
    shareToken = body.shareToken;
    senderName = (body.senderName ?? "").trim();
    message    = body.message ?? undefined;
    recipients = body.recipients;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!shareToken || !senderName || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json(
      { error: "shareToken, senderName, and recipients are required" },
      { status: 400 },
    );
  }

  const cleaned = [...new Set(recipients.map((e) => e.trim().toLowerCase()))].filter((e) =>
    e.includes("@"),
  );

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid recipients" }, { status: 400 });
  }

  let report;
  try {
    report = await prisma.report.findUnique({ where: { shareToken } });
  } catch (err) {
    console.error("[share] DB lookup failed:", err);
    return NextResponse.json({ error: "Failed to look up report" }, { status: 500 });
  }

  if (!report?.reportData) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  let result: WeddingEstimateResult;
  try {
    result = JSON.parse(report.reportData) as WeddingEstimateResult;
  } catch {
    return NextResponse.json({ error: "Corrupt report data" }, { status: 500 });
  }

  let pdfBuffer: Buffer;
  let pdfFilename: string;
  try {
    [pdfBuffer, pdfFilename] = await Promise.all([
      generateReportPdf(result, report.insight ?? null),
      Promise.resolve(buildPdfFilename(result)),
    ]);
  } catch (err) {
    console.error("[share] PDF generation failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }

  const { subject, html, text } = buildShareEmail({
    senderName,
    message: message?.trim() || undefined,
    cityTitle: `${result.city}, ${result.state}`,
    weddingYear: result.weddingYear,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "estimates@ballparkmywedding.com";

  let sent = 0;
  const errors: string[] = [];

  for (const email of cleaned) {
    try {
      const { error: resendError } = await resend.emails.send({
        from: `BallparkMyWedding <${fromEmail}>`,
        to: [email],
        subject,
        html,
        text,
        attachments: [{ filename: pdfFilename, content: pdfBuffer }],
      });
      if (resendError) {
        console.error(`[share] Resend error for ${email}:`, resendError);
        errors.push(email);
        continue;
      }
      sent++;
      prisma.reportShare
        .create({ data: { shareToken, recipientEmail: email } })
        .catch((err: unknown) => console.error(`[share] DB record failed:`, err));
    } catch (err) {
      console.error(`[share] Unexpected error for ${email}:`, err);
      errors.push(email);
    }
  }

  if (sent === 0) {
    return NextResponse.json({ error: "Failed to send to any recipients" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent, failed: errors.length });
}
