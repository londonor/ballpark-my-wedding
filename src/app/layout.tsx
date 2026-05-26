import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { EstimateProvider } from "@/context/EstimateContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-cabinet-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3002"),
  title: "Ballpark My Wedding — Know What Your Wedding Will Cost",
  description:
    "A curated wedding cost estimator. Pick your city, choose your style, and get a real ballpark estimate — so you know exactly what to budget.",
  keywords: [
    "wedding cost estimator",
    "wedding budget calculator",
    "how much does a wedding cost",
    "wedding planning budget",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerif.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <EstimateProvider>{children}</EstimateProvider>
      </body>
    </html>
  );
}
