"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useEstimate } from "@/context/EstimateContext";
import { isPeakSeason, getGuestMidpoint, MONTH_NAMES } from "@/lib/calculations";
import type { Destination, GuestBucket } from "@/types";
import { GUEST_BUCKETS } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { setWedding, reset } = useEstimate();
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const [destinationId, setDestinationId] = useState("");
  const [weddingMonth, setWeddingMonth]   = useState("");
  const [weddingYear, setWeddingYear]     = useState("");
  const [guestBucket, setGuestBucket]     = useState<GuestBucket | "">("");

  useEffect(() => {
    reset();
    fetch("/api/destinations")
      .then((r) => r.json())
      .then(setDestinations);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear + i;
    return { value: y, label: String(y) };
  });

  const monthOptions = MONTH_NAMES.map((name, i) => ({
    value: i + 1,
    label: name,
  }));

  const isValid = !!destinationId && !!weddingMonth && !!weddingYear && !!guestBucket;

  const handleNext = () => {
    const dest = destinations.find((d) => d.id === parseInt(destinationId));
    if (!dest || !guestBucket) return;

    const monthNum = parseInt(weddingMonth);
    const yearNum  = parseInt(weddingYear);
    const peak     = isPeakSeason(monthNum, dest.peakSeasonStart, dest.peakSeasonEnd);
    const midpoint = getGuestMidpoint(guestBucket as GuestBucket);

    setWedding({
      destinationId:   dest.id,
      city:            dest.city,
      state:           dest.state,
      slug:            dest.slug,
      marketType:      dest.marketType,
      peakSeasonStart: dest.peakSeasonStart,
      peakSeasonEnd:   dest.peakSeasonEnd,
      weddingMonth:    monthNum,
      weddingYear:     yearNum,
      isPeak:          peak,
      guestBucket:     guestBucket as GuestBucket,
      guestMidpoint:   midpoint,
      tiers:           {},
    });

    router.push("/estimate");
  };

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-sand-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 flex justify-center">
          <a href="/">
            <img src="/logo.png" alt="Ballpark my wedding" className="h-28 w-auto" />
          </a>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl text-sand-900 mb-2 leading-tight font-bold">
            How much will my wedding cost?
          </h1>
          <p className="text-sand-500 text-base font-medium mb-3">
            A real number in under 2 minutes.
          </p>
          <p className="text-sand-500 text-lg leading-relaxed text-left">
            A curated, city-specific budget estimate based on your location, guest count,
            and the choices that actually move the number — not averages from a Google search.
          </p>
        </div>

        <p
          className="text-left text-sand-700 mb-8"
          style={{
            fontFamily: "var(--font-dm-serif), 'DM Serif Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "1rem",
          }}
        >
          Real vendor data. Updated weekly.
        </p>

        {/* Selectors */}
        <Card className="mb-6 space-y-5">
          <Select
            label="Where are you getting married?"
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            options={destinations.map((d) => ({ value: d.id, label: `${d.city}, ${d.state}` }))}
            placeholder="Choose a city"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Wedding month"
              value={weddingMonth}
              onChange={(e) => setWeddingMonth(e.target.value)}
              options={monthOptions}
              placeholder="Month"
            />
            <Select
              label="Wedding year"
              value={weddingYear}
              onChange={(e) => setWeddingYear(e.target.value)}
              options={yearOptions}
              placeholder="Year"
            />
          </div>

          <Select
            label="How many guests?"
            value={guestBucket}
            onChange={(e) => setGuestBucket(e.target.value as GuestBucket)}
            options={GUEST_BUCKETS.map((b) => ({ value: b.key, label: b.label }))}
            placeholder="Guest count"
          />
        </Card>

        <Button size="lg" className="w-full" disabled={!isValid} onClick={handleNext}>
          Build my estimate
        </Button>

        <p className="text-center text-sand-400 text-xs mt-4 leading-relaxed">
          Takes about 90 seconds. No account required.
        </p>
      </main>
    </div>
  );
}
