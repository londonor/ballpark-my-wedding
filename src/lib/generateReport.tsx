/**
 * src/lib/generateReport.tsx
 *
 * Generates a branded PDF report from a WeddingEstimateResult.
 * Server-only — never import from client components.
 */

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import type { WeddingEstimateResult, WeddingCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { MONTH_NAMES } from "@/lib/calculations";

// ── Brand colours ─────────────────────────────────────────────────────────────
const COLORS = {
  sand50:  "#faf9f7",
  sand100: "#f0ede8",
  sand200: "#e0d9d0",
  sand400: "#a09080",
  sand600: "#6b5f52",
  sand800: "#3a3028",
  sand900: "#1e1812",
  sage500: "#5a8a70",
  sage600: "#4a7560",
  coral:   "#e07060",
  white:   "#ffffff",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 40,
    paddingVertical: 36,
    fontFamily: "Helvetica",
    color: COLORS.sand800,
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1.5pt solid ${COLORS.sand200}`,
    paddingBottom: 14,
    marginBottom: 20,
  },
  logo: { height: 22, objectFit: "contain" },
  headerSite: { fontSize: 9, color: COLORS.sand400, letterSpacing: 0.3 },
  heroBanner: {
    marginTop: -36,
    marginLeft: -40,
    marginRight: -40,
    height: 130,
    objectFit: "cover",
    marginBottom: 20,
  },
  totalBanner: {
    backgroundColor: COLORS.sage500,
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel:  { color: COLORS.white, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.85, marginBottom: 4 },
  totalAmount: { color: COLORS.white, fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: -0.3 },
  totalMeta:   { color: COLORS.white, fontSize: 9, opacity: 0.8, textAlign: "right" },
  ppCard: {
    border: `1pt solid ${COLORS.sand200}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    backgroundColor: COLORS.sand50,
  },
  ppTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: COLORS.sand600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  ppRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  ppLabel: { color: COLORS.sand600, fontSize: 10 },
  ppValue: { fontFamily: "Helvetica-Bold", color: COLORS.sand800, fontSize: 10 },
  insightCard: {
    backgroundColor: COLORS.sand50,
    border: `1pt solid ${COLORS.sand200}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  insightLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.sage600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  insightText:  { fontSize: 10, color: COLORS.sand800, lineHeight: 1.6 },
  catCard: {
    border: `1pt solid ${COLORS.sand200}`,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  catHeader: {
    backgroundColor: COLORS.sand100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catHeaderName: { fontFamily: "Helvetica-Bold", fontSize: 11, color: COLORS.sand900 },
  catHeaderAmount: { fontFamily: "Helvetica-Bold", fontSize: 11, color: COLORS.sand800 },
  catBody: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  catTierName: { fontSize: 9, color: COLORS.sand400, marginBottom: 4 },
  catBlurb:    { fontSize: 8, color: COLORS.sand400, lineHeight: 1.5 },
  disclaimer: { marginTop: 14, backgroundColor: COLORS.sand50, borderRadius: 8, padding: 12 },
  disclaimerText: { fontSize: 8.5, color: COLORS.sand400, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5pt solid ${COLORS.sand200}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: COLORS.sand400 },
});

// ── Bold markdown renderer ────────────────────────────────────────────────────

function pdfBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>{part}</Text>
    ) : (
      <Text key={i}>{part}</Text>
    ),
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtRange(lo: number, hi: number): string {
  if (lo === 0 && hi === 0) return "$0";
  return `${fmt(lo)} – ${fmt(hi)}`;
}

function readImageAsBase64(dirSegments: string[], baseName: string): string | null {
  for (const ext of ["jpg", "png"] as const) {
    const p = path.join(process.cwd(), "public", ...dirSegments, `${baseName}.${ext}`);
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p);
      const mime = ext === "jpg" ? "image/jpeg" : "image/png";
      return `data:${mime};base64,${data.toString("base64")}`;
    }
  }
  return null;
}

function loadPdfHeroImage(slug: string): string | null {
  const dest    = ["images", "destinations", slug];
  const generic = ["images", "destinations", "generic"];
  return (
    readImageAsBase64([...dest,    "banner"], "1") ??
    readImageAsBase64([...dest,    "hero"],   "1") ??
    readImageAsBase64([...generic, "banner"], "1") ??
    readImageAsBase64([...generic, "hero"],   "1")
  );
}

// ─��� PDF Document ──────────────────────────────────────────────────────────────

interface ReportDocProps {
  result: WeddingEstimateResult;
  logoPath: string;
  generatedDate: string;
  insight?: string | null;
  heroImageData?: string | null;
}

function ReportDoc({ result, logoPath, generatedDate, insight, heroImageData }: ReportDocProps) {
  const monthName  = MONTH_NAMES[result.weddingMonth - 1] ?? "";
  const guestLabel = `~${result.guestMidpoint} guests`;

  return (
    <Document
      title={`BallparkMyWedding — ${result.city}, ${result.state}`}
      author="BallparkMyWedding.com"
    >
      <Page size="A4" style={S.page}>
        {!!heroImageData && <Image src={heroImageData} style={S.heroBanner} />}

        <View style={S.header} fixed>
          <Image src={logoPath} style={S.logo} />
          <Text style={S.headerSite}>ballparkmywedding.com</Text>
        </View>

        <View style={S.totalBanner}>
          <View>
            <Text style={S.totalLabel}>Your ballpark wedding estimate</Text>
            <Text style={S.totalAmount}>
              {fmtRange(result.grandTotalLow, result.grandTotalHigh)}
            </Text>
          </View>
          <View>
            <Text style={S.totalMeta}>{result.city}, {result.state}</Text>
            <Text style={[S.totalMeta, { marginTop: 2 }]}>{monthName} {result.weddingYear}</Text>
            <Text style={[S.totalMeta, { marginTop: 2 }]}>{guestLabel}</Text>
          </View>
        </View>

        {!!insight && (
          <View style={S.insightCard}>
            <Text style={S.insightLabel}>What to know about your wedding</Text>
            <Text style={S.insightText}>{pdfBold(insight)}</Text>
          </View>
        )}

        <View style={S.ppCard} break>
          <Text style={S.ppTitle}>Per-guest cost</Text>
          <View style={S.ppRow}>
            <Text style={S.ppLabel}>Per guest (est. {result.guestMidpoint} guests)</Text>
            <Text style={S.ppValue}>{fmtRange(result.perGuestLow, result.perGuestHigh)}</Text>
          </View>
          {result.isPeak && (
            <View style={S.ppRow}>
              <Text style={[S.ppLabel, { color: COLORS.coral }]}>Peak season pricing applied</Text>
            </View>
          )}
        </View>

        {result.categories.map((cat, i) => (
          <View key={i} style={S.catCard}>
            <View style={S.catHeader}>
              <Text style={S.catHeaderName}>
                {CATEGORY_LABELS[cat.category as WeddingCategory] ?? cat.category}
              </Text>
              <Text
                style={
                  cat.totalLow === 0 && cat.totalHigh === 0
                    ? [S.catHeaderAmount, { color: COLORS.sage600 }]
                    : S.catHeaderAmount
                }
              >
                {fmtRange(cat.totalLow, cat.totalHigh)}
              </Text>
            </View>
            <View style={S.catBody}>
              <Text style={S.catTierName}>{cat.tierName}</Text>
              {!!cat.blurb && <Text style={S.catBlurb}>{cat.blurb}</Text>}
            </View>
          </View>
        ))}

        <View style={S.disclaimer}>
          <Text style={S.disclaimerText}>
            This is a ballpark estimate for wedding costs in {result.city}. It does not include
            honeymoon travel, engagement rings, marriage license fees, or vendor gratuities.
            Per-head categories are calculated using a guest count midpoint of {result.guestMidpoint}.
            Actual costs will vary based on vendor availability, negotiation, and your choices on the day.
          </Text>
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Generated by BallparkMyWedding.com</Text>
          <Text style={S.footerText}>{generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateReportPdf(
  result: WeddingEstimateResult,
  insight?: string | null,
): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoData = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const heroImageData = loadPdfHeroImage(result.slug);

  const element = (
    <ReportDoc
      result={result}
      logoPath={logoBase64}
      generatedDate={generatedDate}
      insight={insight}
      heroImageData={heroImageData}
    />
  );

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

export function buildPdfFilename(result: WeddingEstimateResult): string {
  const citySlug = result.city.toLowerCase().replace(/\s+/g, "-");
  const date = new Date().toISOString().slice(0, 10);
  return `ballpark-wedding-${citySlug}-${date}.pdf`;
}
