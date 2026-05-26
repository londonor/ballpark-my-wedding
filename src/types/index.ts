export type WeddingCategory =
  | "venue"
  | "catering"
  | "bar"
  | "photography"
  | "florals"
  | "music"
  | "planner"
  | "attire"
  | "stationery";

export type GuestBucket =
  | "0to25" | "25to50" | "50to75" | "75to100"
  | "100to125" | "125to150" | "150to175" | "175to200"
  | "200to225" | "225to250" | "250to300" | "300plus";

export const GUEST_BUCKETS: { key: GuestBucket; label: string; midpoint: number }[] = [
  { key: "0to25",    label: "Up to 25 guests",   midpoint: 13  },
  { key: "25to50",   label: "25–50 guests",       midpoint: 38  },
  { key: "50to75",   label: "50–75 guests",       midpoint: 63  },
  { key: "75to100",  label: "75–100 guests",      midpoint: 88  },
  { key: "100to125", label: "100–125 guests",     midpoint: 113 },
  { key: "125to150", label: "125–150 guests",     midpoint: 138 },
  { key: "150to175", label: "150–175 guests",     midpoint: 163 },
  { key: "175to200", label: "175–200 guests",     midpoint: 188 },
  { key: "200to225", label: "200–225 guests",     midpoint: 213 },
  { key: "225to250", label: "225–250 guests",     midpoint: 238 },
  { key: "250to300", label: "250–300 guests",     midpoint: 275 },
  { key: "300plus",  label: "300+ guests",        midpoint: 350 },
];

export const WEDDING_CATEGORIES: { key: WeddingCategory; label: string }[] = [
  { key: "venue",       label: "Venue" },
  { key: "catering",    label: "Catering" },
  { key: "bar",         label: "Bar & Beverages" },
  { key: "photography", label: "Photography & Video" },
  { key: "florals",     label: "Florals & Decor" },
  { key: "music",       label: "Music & Entertainment" },
  { key: "planner",     label: "Wedding Planner" },
  { key: "attire",      label: "Attire & Beauty" },
  { key: "stationery",  label: "Stationery & Invitations" },
];

export const CATEGORY_LABELS: Record<WeddingCategory, string> = {
  venue:       "Venue",
  catering:    "Catering",
  bar:         "Bar & Beverages",
  photography: "Photography & Video",
  florals:     "Florals & Decor",
  music:       "Music & Entertainment",
  planner:     "Wedding Planner",
  attire:      "Attire & Beauty",
  stationery:  "Stationery & Invitations",
};

export interface Destination {
  id: number;
  city: string;
  state: string;
  slug: string;
  marketType: string;
  peakSeasonStart: number; // month 1–12
  peakSeasonEnd: number;
}

export interface TierExample {
  id: number;
  tierId: number;
  exampleLabel: string;
  pricePeak: number;
  priceOffPeak: number;
  displayOrder: number;
  guestCount: number | null;
}

export interface TierOption {
  id: number;
  destinationId: number;
  category: WeddingCategory;
  tierName: string;
  tierOrder: number;
  pricingType: string; // "flat" | "per_head"
  priceLowPeak: number;
  priceHighPeak: number;
  priceLowOffPeak: number;
  priceHighOffPeak: number;
  blurb: string;
  foodModel: string;        // "extra" | "included" | "minimum"
  alcoholModel: string;     // "extra" | "included" | "minimum"
  foodMinimum: number | null;
  alcoholMinimum: number | null;
  minimumIsCombined: boolean;
  examples?: TierExample[];
}

export interface WeddingSelection {
  destinationId: number;
  city: string;
  state: string;
  slug: string;
  marketType: string;
  peakSeasonStart: number;
  peakSeasonEnd: number;
  weddingMonth: number; // 1–12
  weddingYear: number;
  isPeak: boolean;
  guestBucket: GuestBucket;
  guestMidpoint: number;
  tiers: Partial<Record<WeddingCategory, TierOption>>;
  // The user's picked TierExample per category. Stored as {price, guestCount}
  // so the engine can re-scale per_head examples to the user's guest count.
  // guestCount = null means the example's price is treated verbatim.
  tierExamples?: Partial<Record<WeddingCategory, { price: number; guestCount: number | null }>>;
}

export interface WeddingState {
  wedding: WeddingSelection | null;
  currentCategoryIndex: number;
}

export interface CategoryEstimate {
  category: WeddingCategory;
  tierName: string;
  blurb: string;
  pricingType: string;
  totalLow: number;
  totalHigh: number;
}

export interface WeddingEstimateResult {
  city: string;
  state: string;
  slug: string;
  weddingMonth: number;
  weddingYear: number;
  isPeak: boolean;
  guestBucket: GuestBucket;
  guestMidpoint: number;
  categories: CategoryEstimate[];
  grandTotalLow: number;
  grandTotalHigh: number;
  perGuestLow: number;
  perGuestHigh: number;
}
