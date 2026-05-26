import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { generateReportPdf, buildPdfFilename } from "@/lib/generateReport";
import { buildEstimateEmail } from "@/lib/emailTemplates/estimateEmail";
import { syncToKlaviyo } from "@/lib/klaviyo";
import type { WeddingEstimateResult } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  let email: string;
  let shareToken: string | undefined;

  try {
    const body = await request.json();
    email      = body.email;
    shareToken = body.shareToken;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Look up the report
  let result: WeddingEstimateResult | null = null;
  let reportInsight: string | null = null;

  if (shareToken) {
    try {
      const report = await prisma.report.findUnique({ where: { shareToken } });
      if (report?.reportData) {
        result = JSON.parse(report.reportData) as WeddingEstimateResult;
        reportInsight = report.insight ?? null;
      }
    } catch (err) {
      console.error("[leads] Failed to look up report:", err);
    }
  }

  if (!result) {
    return NextResponse.json({ error: "Report not found — cannot generate PDF" }, { status: 500 });
  }

  // Generate PDF
  let pdfBuffer: Buffer;
  let pdfFilename: string;
  try {
    [pdfBuffer, pdfFilename] = await Promise.all([
      generateReportPdf(result, reportInsight),
      Promise.resolve(buildPdfFilename(result)),
    ]);
  } catch (err) {
    console.error("[leads] PDF generation failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }

  // Send email via Resend
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "estimates@ballparkmywedding.com";
  const { subject, html, text } = buildEstimateEmail({
    cityTitle: `${result.city}, ${result.state}`,
    pdfFilename,
  });

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
      console.error("[leads] Resend error:", resendError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  } catch (err) {
    console.error("[leads] Resend threw:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Save lead (non-fatal)
  try {
    await prisma.lead.create({ data: { email, city: result.city } });
  } catch (err) {
    console.error("[leads] DB lead save failed:", err);
  }

  // Klaviyo fire-and-forget
  syncToKlaviyo({ email, city: result.slug }).catch((err) => {
    console.error("[leads] Klaviyo sync threw:", err);
  });

  return NextResponse.json({ success: true });
}
