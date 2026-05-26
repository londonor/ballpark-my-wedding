/**
 * scripts/split-top-tiers.ts
 *
 * Splits the top tier of venue, photography, florals, and music into two:
 *   - New tier 1: ultra-premium / iconic
 *   - Revised tier 2 (old tier 1): tightened range, revised blurb
 *
 * Run: npx tsx scripts/split-top-tiers.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "../prisma/dev.db");
const db = new Database(DB_PATH);

type TierSplit = {
  newName: string;
  newPriceLowPeak: number;
  newPriceHighPeak: number;
  newPriceLowOffPeak: number;
  newPriceHighOffPeak: number;
  newBlurb: string;
  revisedName: string;
  revisedPriceLowPeak: number;
  revisedPriceHighPeak: number;
  revisedPriceLowOffPeak: number;
  revisedPriceHighOffPeak: number;
  revisedBlurb: string;
};

type CitySplits = {
  venue: TierSplit;
  photography: TierSplit;
  florals: TierSplit;
  music: TierSplit;
};

const SPLITS: Record<string, CitySplits> = {

  "asheville": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 20000, newPriceHighPeak: 26000,
      newPriceLowOffPeak: 13500, newPriceHighOffPeak: 18000,
      newBlurb: "The Biltmore Estate — George Vanderbilt's 250-room Châteauesque mansion on 8,000 acres with a winery, formal gardens, and multiple event spaces — is the most celebrated wedding venue in Western North Carolina. Exclusive Saturday event packages run $20,000 to $26,000 for the site alone; full celebrations including Biltmore's preferred caterers regularly reach $50,000 to $80,000-plus. Reserve 18 months out for peak October foliage.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 14000, revisedPriceHighPeak: 20000,
      revisedPriceLowOffPeak: 9500, revisedPriceHighOffPeak: 14000,
      revisedBlurb: "Chestnut Ridge in Canton (a 150-acre Blue Ridge homestead with sweeping mountain views) and Laurel Falls Historic Wedding Venue (from $13,500 peak weekends) offer the Blue Ridge estate aesthetic — stone architecture, meadow panoramas, seasonal wildflowers — at site fees of $14,000 to $20,000. A more personal, buyout-focused experience than the city's landmark institution tier.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 7500, newPriceHighPeak: 10000,
      newPriceLowOffPeak: 6000, newPriceHighOffPeak: 8500,
      newBlurb: "Lead photographer, dedicated second photographer, and a cinematographer producing a feature film and highlight reel — with an engagement session and premium fine-art album included. Top-tier Asheville editorial photographers whose work appears in Style Me Pretty and Junebug Weddings, with deep Biltmore Estate experience and Blue Ridge landscape mastery, operate at this level. At this tier your photographer has shot the Biltmore in every light condition and understands the full visual potential of October foliage.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5000, revisedPriceHighPeak: 7500,
      revisedPriceLowOffPeak: 4000, revisedPriceHighOffPeak: 6000,
      revisedBlurb: "A lead photographer, second shooter, and a separate videography team for full-day Asheville wedding coverage. Wedding.report puts Asheville photo and video combined at $5,244 to $6,410 for 75 guests; skilled Asheville teams with strong portfolios at mountain venues and barns operate in this range. Asheville's photography community is deep and competitive for its size, driven by the region's destination wedding volume.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11500, newPriceHighOffPeak: 16000,
      newBlurb: "Full-scale venue transformation by Asheville's most sought-after floral studios — ceiling installations in barn rafters, immersive ceremony arches, and tablescapes using rare locally grown wildflowers, dried grasses, and foraged Appalachian botanicals. These studios work with multi-month lead times, have specific Biltmore Estate credentials, and bring a couture sensibility to the mountain environment.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6500, revisedPriceHighOffPeak: 11500,
      revisedBlurb: "Large-scale floral design with an Appalachian mountain sensibility — locally grown wildflowers, dried grasses, trailing ferns, and lush foliage installations that complement rather than compete with the Blue Ridge backdrop. Full installation work at an estate venue or large barn with ceremony arch and full tablescapes runs $8,000 to $14,000 for skilled Asheville studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 8000, newPriceHighPeak: 12000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9500,
      newBlurb: "A full 10 to 12-piece band — complete horn section, multiple vocalists, full rhythm section — drawn from Asheville's extraordinarily deep Americana, bluegrass, and folk rock music scene. Acts at this level perform regionally and nationally, bring professional production specs, and deliver a full-evening entertainment experience that captures the Blue Ridge musical culture. A marquee live band in an Asheville barn is among the most tonally perfect wedding entertainment experiences in the American South.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 3500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Asheville, where the music scene is disproportionately strong for the city's size — Americana, bluegrass, folk rock, and indie country are the native registers. Wedding.report puts Asheville live band spend at $3,132 to $3,828 on average; skilled acts with wedding entertainment reputations run $4,500 to $8,000.",
    },
  },

  "atlanta": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 19000, newPriceHighPeak: 26000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 18000,
      newBlurb: "Swan House at the Atlanta History Center — a National Historic Landmark 1928 mansion on 33 acres in Buckhead with cascading formal gardens and the Grand Overlook Ballroom — represents Atlanta's apex venue tier at $13,500 Saturday peak site rental plus a $6,000 beverage minimum. Callanwolde Fine Arts Center (the 27,000 sq ft Candler family estate in Druid Hills) operates at similar altitude. Full estate events here run $400 to $1,000-plus per guest all-in.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 13000, revisedPriceHighPeak: 19000,
      revisedPriceLowOffPeak: 9000, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Rhodes Hall ('the Castle on Peachtree') — an 1902 Romanesque stone mansion operated by the Georgia Trust — and Callanwolde's secondary event spaces bring Atlanta's private historic estate character at site fees of $13,000 to $19,000. These venues combine architectural grandeur with manicured grounds and are particularly celebrated for their lush tree canopy in summer and Buckhead setting.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a director-cut feature film and highlight reel. Atlanta's top editorial wedding photographers who shoot regularly at Swan House, the St. Regis Buckhead, and the city's historic mansions — photographers whose work appears in print publications — run $8,000 to $11,000. At this level you hire a team with a pre-visualized approach to Atlanta's Buckhead architectural grandeur and the city's extraordinary summer tree canopy.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for full-day Atlanta coverage. Elev8 puts Atlanta photography and videography combined at $3,000 to $7,000; skilled Atlanta teams who work regularly at Buckhead estate venues and historic properties run $5,500 to $8,000. Atlanta's mix of architectural grandeur, lush tree canopy, and modern skyline gives photographers strong backdrop options.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 16000, newPriceHighPeak: 22000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 18000,
      newBlurb: "Full-scale installation work by Atlanta's most celebrated floral studios — studios that work with Swan House, the St. Regis, and comparable Buckhead properties with $10,000-plus minimums. Rare magnolia blossoms, peonies from North Georgia flower farms, and dramatic ceiling and ceremony arch installations at scales that transform landmark ballrooms. Multi-month booking lead times required for peak season.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 9000, revisedPriceHighPeak: 16000,
      revisedPriceLowOffPeak: 7500, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a Southern sensibility — magnolia blossoms, hydrangeas, peonies, and seasonal blooms with installation work scaled to Buckhead estate venues. Full installation with ceremony arch and full tablescapes at Swan House or comparable properties runs $9,000 to $16,000 at skilled Atlanta floral studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 9000, newPriceHighPeak: 13000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10500,
      newBlurb: "A full 10 to 12-piece band drawing from Atlanta's deep R&B, soul, and gospel music tradition — a city that shaped American popular music through Outkast, Usher, and TLC. Acts at this level bring horn sections, multiple vocalists, and a full-evening production spec that turns a Buckhead estate ballroom into a concert experience. These bands perform for corporate galas and touring acts and bring that caliber to wedding entertainment.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 3800, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Atlanta, where the music scene spans R&B, soul, Southern rock, and the city's strong jazz heritage. Wedding.report puts Atlanta band spend at $2,910 to $3,556 on average; skilled acts with strong Atlanta wedding entertainment reputations run $4,500 to $9,000.",
    },
  },

  "austin": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 32000, newPriceHighPeak: 42000,
      newPriceLowOffPeak: 21000, newPriceHighOffPeak: 28000,
      newBlurb: "Commodore Perry Estate in Hyde Park — a National Historic Landmark with weekend rental fees of $15,000 to $38,000 plus F&B minimums from $25,000 — and Camp Lucy in Dripping Springs with a chapel, vineyard, and forest setting on one ranch. These venues require exclusive buyouts, approved vendor lists, and 12 to 18 months of advance planning for peak March–May and September–November Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 22000, revisedPriceHighPeak: 32000,
      revisedPriceLowOffPeak: 15000, revisedPriceHighOffPeak: 21000,
      revisedBlurb: "Videre Estate on 562 Hill Country acres in Wimberley and The Villa at the Vineyard in Driftwood represent Austin's private estate tier. Canyonwood Ridge on Lake Travis and Antebellum Oaks in Manor bring limestone Hill Country character at site fees of $22,000 to $32,000. Book 12 months out for peak Hill Country season.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 9000, newPriceHighPeak: 12000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a director-cut feature film. Austin's most sought-after photographers — those published in Style Me Pretty and national bridal magazines, with portfolio experience at Commodore Perry Estate, Camp Lucy, and Hill Country landscape venues — run $9,000 to $12,000. At this tier your team is a co-creative partner who has pre-visualized the golden-hour Hill Country light at your specific venue.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Austin wedding day. Bianca Nichole & Co puts Austin photography in the mid-market range at $5,000 to $8,000; skilled Austin teams with Hill Country experience and strong editorial-leaning portfolios operate in the $6,000 to $9,000 range. Texas's extraordinary golden light and dramatic Hill Country landscape reward experienced local photographers.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 21000, newPriceHighPeak: 30000,
      newPriceLowOffPeak: 17000, newPriceHighOffPeak: 25000,
      newBlurb: "Full-scale transformation of Austin's Hill Country venues — ceiling installations in barn rafters, elaborate ceremony arches against limestone walls, and lush tablescapes using rare imported blooms alongside Texas wildflowers. Austin floral studios operating at this level carry $12,000+ minimums for event work at Commodore Perry Estate and comparable properties, with booking windows of 9 to 12 months for peak season.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 21000,
      revisedPriceLowOffPeak: 10000, revisedPriceHighOffPeak: 17000,
      revisedBlurb: "Large-scale floral design that transforms Austin's Hill Country venues — ceremony arches against limestone walls, lush tablescapes with Texas wildflowers and Hill Country greenery. Bianca Nichole & Co puts Austin florals at $6,000 to $14,000 for full installation work; skilled Austin studios with strong Hill Country venue portfolios run $12,000 to $21,000.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11000, newPriceHighOffPeak: 16000,
      newBlurb: "Austin is the Live Music Capital of the World, and the talent pool at this tier is genuinely extraordinary. A full 10 to 12-piece band — working musicians who perform at Stubb's and the Continental Club, with horn sections, multiple vocalists, and the ability to move seamlessly between country, rock, and R&B — creates a wedding reception that is a different category of experience. Ma Maison notes Austin bands run up to $40,000 at the luxury end; $14,000 to $20,000 is where the marquee acts begin.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 7000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 5500, revisedPriceHighOffPeak: 11000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Austin, where the working musician talent pool is exceptional. Bianca Nichole & Co puts Austin band cost at $7,000 to $12,000 for skilled acts; strong vocalists who play the local circuit and know Hill Country venues deliver a genuinely authentic Austin musical experience at this range.",
    },
  },

  "boston": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 25000, newPriceHighPeak: 32000,
      newPriceLowOffPeak: 17000, newPriceHighOffPeak: 23000,
      newBlurb: "The Bradley Estate in Canton — operated by The Trustees of Reservations, with full-property celebration packages at $30,000-plus — and Willowdale Estate in Topsfield at $13,000 Saturday site rental with event minimums of $21,000 to $25,500 represent Boston's apex venue tier. These North Shore estate properties offer full exclusive access to manicured grounds, formal gardens, and period interiors that no hotel ballroom replicates. Book 12 to 18 months out for fall foliage dates.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 18000, revisedPriceHighPeak: 25000,
      revisedPriceLowOffPeak: 12000, revisedPriceHighOffPeak: 17000,
      revisedBlurb: "Pierce House in Lincoln, the Mansion on Turner Hill in Ipswich, and Moraine Farm overlooking Wenham Lake represent Boston's accessible historic estate tier at site fees of $18,000 to $25,000. These properties combine historic New England architecture with manicured grounds and are particularly sought after for October foliage and late June weddings.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 9500, newPriceHighPeak: 13000,
      newPriceLowOffPeak: 8000, newPriceHighOffPeak: 11000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film and highlight reel — with engagement session and premium album. Boston's top editorial wedding photographers who work regularly at the Fairmont Copley, the Liberty Hotel, and Willowdale Estate — photographers whose work appears in Boston Magazine's Weddings and national bridal publications — run $9,500 to $13,000. At this tier your team maximizes Boston's autumn foliage, the Charles River at golden hour, and the city's extraordinary Beaux-Arts architectural backdrop.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 6500, revisedPriceHighPeak: 9500,
      revisedPriceLowOffPeak: 5500, revisedPriceHighOffPeak: 8000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Boston wedding day. Wedding.report puts Boston photo and video combined at $3,032 to $5,255 on average; skilled Boston teams who work regularly at historic estate and hotel venues run $6,500 to $9,500. The city's extraordinary architectural backdrop rewards experienced local photographers.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 20000, newPriceHighPeak: 28000,
      newPriceLowOffPeak: 16000, newPriceHighOffPeak: 22000,
      newBlurb: "Full-scale installation work by Boston's most celebrated floral studios — studios operating with $10,000-plus minimums at the Fairmont, the Liberty Hotel, and Willowdale Estate. Locally grown peonies and hydrangeas (a New England specialty) combined with elaborate ceiling treatments, ceremony arches, and full tablescapes that transform historic ballrooms. Multi-season booking windows required for October events.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 20000,
      revisedPriceLowOffPeak: 10000, revisedPriceHighOffPeak: 16000,
      revisedBlurb: "Large-scale floral design with a New England sensibility — locally grown peonies, garden roses, and hydrangeas with installation work scaled to historic ballrooms and estate venues. Adam Gorham Films puts Massachusetts floral spend at $3,000 to $6,000 for typical weddings; skilled studios with full installation capabilities run $12,000 to $20,000.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 12000, newPriceHighPeak: 18000,
      newPriceLowOffPeak: 9500, newPriceHighOffPeak: 14000,
      newBlurb: "A full 10 to 12-piece band drawing from Boston's extraordinary musical bench — the city's classical freelancers, jazz tradition, and wedding band heritage serving the Catholic and Jewish communities. These acts bring full horn sections, string quartets for ceremonies, and the ability to perform multi-set Motown, big band, and contemporary dance music formats at a genuinely professional touring act level.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 12000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 9500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Boston, where the music culture spans classical, jazz, Irish folk, and indie rock. Wedding.report puts Boston live band spend at $3,476 to $5,394 on average; premium acts with strong wedding entertainment reputations run $6,000 to $12,000.",
    },
  },

  "charleston": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 24000, newPriceHighPeak: 30000,
      newPriceLowOffPeak: 17000, newPriceHighOffPeak: 22000,
      newBlurb: "Middleton Place on the Ashley River — America's oldest continuously maintained landscaped gardens, a National Historic Landmark — and Magnolia Plantation & Gardens represent Lowcountry wedding venues at their most storied. Full plantation buyouts with tenting run $24,000 to $30,000 for the site; total event costs for 150 guests reach $60,000 to $100,000-plus. Book 12 to 18 months out for October and November Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 18000, revisedPriceHighPeak: 24000,
      revisedPriceLowOffPeak: 13000, revisedPriceHighOffPeak: 17000,
      revisedBlurb: "Boone Hall Plantation — continuously farmed since 1681, celebrated for its Avenue of Oaks — and Lowndes Grove on the Ashley River offer the signature Lowcountry plantation estate experience at site fees of $18,000 to $24,000. Live oaks, Spanish moss, antebellum architecture, and exclusive grounds access for your ceremony and reception.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 7000, newPriceHighPeak: 9500,
      newPriceLowOffPeak: 6000, newPriceHighOffPeak: 8000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer — with engagement session and premium fine-art album. Charleston's most celebrated editorial wedding photographers whose Lowcountry work appears regularly in Southern Weddings and Style Me Pretty run $7,000 to $9,500. At this tier your photographer has specific experience with live oak light, moss-draped plantation grounds at dusk, and the way the Harbor light falls in June.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5000, revisedPriceHighPeak: 7000,
      revisedPriceLowOffPeak: 4200, revisedPriceHighOffPeak: 6000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Charleston wedding day. Wedding.report puts Charleston photo and video combined at $3,381 to $4,133 for 125 guests at mid-market; skilled Charleston teams with plantation and waterfront venue portfolios run $5,000 to $7,000. The Lowcountry's extraordinary light and live oaks attract strong photographic talent.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 17000, newPriceHighPeak: 25000,
      newPriceLowOffPeak: 14000, newPriceHighOffPeak: 20000,
      newBlurb: "Full-scale installation work by Charleston's most celebrated floral studios — Branch Design Studio and Tiger Lily Florist working at plantation and estate venues with elaborate ceiling treatments, ceremony arches against moss-draped live oaks, and full tablescapes built around azaleas, camellias, gardenias, and rare seasonal imports. Studios at this level carry multi-month booking windows for October.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 10000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8500, revisedPriceHighOffPeak: 14000,
      revisedBlurb: "Large-scale floral design built around Charleston's extraordinary botanical context — azaleas, camellias, gardenias, magnolia branches, and Lowcountry wildflowers. Full installation work at Middleton Place, Magnolia Plantation, or comparable estate venues runs $10,000 to $17,000 at skilled Charleston studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 11000, newPriceHighPeak: 16000,
      newPriceLowOffPeak: 9000, newPriceHighOffPeak: 13000,
      newBlurb: "A full 10 to 12-piece band drawing from Charleston's deep performing community — jazz, blues, beach music (the Lowcountry-specific genre built on shag dancing), and soul. The Deas Guyz and acts of similar caliber represent Charleston's most celebrated wedding bands. At this level you get a full horn section, multiple vocalists, and professional production specs matched to a Middleton Place or plantation setting.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 11000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 9000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Charleston, where live music is deeply woven into the culture. Wedding.report puts live band spend for a 125-guest Charleston wedding at $2,156 to $2,636 on average; premium acts from Charleston's strong performing community run $6,000 to $11,000.",
    },
  },

  "chicago": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 19000, newPriceHighPeak: 26000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 19000,
      newBlurb: "Private estate buyouts in Lake Forest, Winnetka, and Kenilworth — the North Shore's historic Gold Coast — and the International Museum of Surgical Science (a 1917 Beaux-Arts mansion overlooking Lake Michigan) represent Chicago's most exclusive private venue category. Peak Saturday buyouts at landmark estate properties run $19,000 to $26,000 for site access alone, with architecture, history, and grounds that serve as the wedding design itself.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 13000, revisedPriceHighPeak: 19000,
      revisedPriceLowOffPeak: 9000, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Stan Mansion in Logan Square — a Neoclassical 1908 mansion with a 7,000 sq ft grand ballroom — and Cheney Mansion in Oak Park ($4,200 for a 5-hour event buyout) represent Chicago's accessible historic mansion tier at site fees of $13,000 to $19,000. The Chicago History Museum and Newberry Library also offer elegant evening buyouts in this range.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 9500, newPriceHighPeak: 13000,
      newPriceLowOffPeak: 8000, newPriceHighOffPeak: 10500,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film and highlight reel. Chicago's most celebrated editorial wedding photographers with deep experience at the Drake Hotel, the Rookery, and Chicago landmark venues — photographers whose work appears in print — run $9,500 to $13,000. At this tier your team knows the Loop's limestone canyon at sunset, the Riverwalk in summer bloom, and the dramatic lakefront light in all its forms.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 6500, revisedPriceHighPeak: 9500,
      revisedPriceLowOffPeak: 5500, revisedPriceHighOffPeak: 8000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Chicago wedding day. The Knot's Chicago data puts the average wedding photographer at $3,740; skilled Chicago teams who work regularly at landmark venues run $6,500 to $9,500. Chicago's extraordinary architectural backdrop rewards photographers with significant local experience.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 20000, newPriceHighPeak: 28000,
      newPriceLowOffPeak: 16000, newPriceHighOffPeak: 22000,
      newBlurb: "Full-scale installation work by Chicago's top floral studios — those operating with $10,000 to $12,000 minimums at the Drake, the Rookery, and Chicago Hilton. Elaborate ceremony arches, ceiling installations, and lush tablescapes using locally grown peonies and seasonal flowers from the Chicago-area cut-flower farming community, scaled to the proportions of the city's landmark ballrooms.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 20000,
      revisedPriceLowOffPeak: 9500, revisedPriceHighOffPeak: 16000,
      revisedBlurb: "Large-scale floral design scaled to Chicago's landmark venues — locally grown peonies, garden roses, and hydrangeas with installation work at the city's historic ballrooms. Skilled studios with full installation capabilities run $12,000 to $20,000 for ceremony arch, full tablescapes, and reception florals.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 10000, newPriceHighPeak: 15000,
      newPriceLowOffPeak: 8000, newPriceHighOffPeak: 12000,
      newBlurb: "A full 10 to 12-piece band drawing from Chicago's foundational American music traditions — Chicago blues, house music (Chicago invented house), jazz from the Great Migration tradition, and soul. Acts at this level draw from the Chicago Federation of Musicians' deep professional bench and perform for corporate galas and touring productions. A Chicago blues band or soul revue at a downtown landmark is genuinely irreplaceable wedding entertainment.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 10000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 8000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Chicago, where the music culture spans blues, house, jazz, gospel, and soul. Premium acts with strong Chicago wedding entertainment reputations run $5,500 to $10,000. The Chicago Federation of Musicians supports one of America's deepest professional musician communities.",
    },
  },

  "dallas": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 17000, newPriceHighPeak: 22000,
      newPriceLowOffPeak: 12000, newPriceHighOffPeak: 16000,
      newBlurb: "Knotting Hill Place in Little Elm — European-inspired architecture, grand indoor chapel, peak Saturday $14,900 for 151–300 guests — and The Olana in Hickory Creek with Tuscan-inspired architecture and all-inclusive packages represent Dallas's apex venue tier. These estates combine dramatic architecture with full-scale event infrastructure and book 12 months out for peak fall Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8500, revisedPriceHighOffPeak: 12000,
      revisedBlurb: "The Hillside Estate in Cedar Hill ($7,250 to $14,000 peak Saturday) and Alexander Mansion and Chateau Nouvelle bring the European estate aesthetic to Dallas at site fees of $12,000 to $17,000. These properties offer formal architecture and manicured grounds at a more accessible scale than the Knotting Hill and Olana apex.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer. Dallas's top editorial wedding photographers who work regularly at The Olana, Hotel Crescent Court, and luxury estate properties run $8,000 to $11,000. At this tier your team brings a pre-visualized approach to Dallas's visual vocabulary: bluebonnet season light, the grandeur of a Knotting Hill ballroom at golden hour, the skyline from a Uptown rooftop.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Dallas wedding day. Carlee Mae Photography puts Dallas photography at $3,500 to $7,000 with experienced photographers; skilled Dallas teams who work regularly at luxury estate and hotel venues run $5,500 to $8,000.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 16000, newPriceHighPeak: 22000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 18000,
      newBlurb: "Full-scale installation work by Dallas's top floral studios at grand ballroom venues — elaborate ceremony arches, ceiling installations, and bold tablescapes using locally grown peonies, dahlias from North Texas flower farms, and rare seasonal imports. The Dallas Market Center's wholesale floral district supports a strong local design community operating at the luxury level.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 9000, revisedPriceHighPeak: 16000,
      revisedPriceLowOffPeak: 7500, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a Texas sensibility — locally grown peonies, dahlias, and bold seasonal blooms with installation work scaled to grand Dallas venue spaces. Full installation at Knotting Hill, The Hillside Estate, or comparable properties runs $9,000 to $16,000 at skilled Dallas studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 9000, newPriceHighPeak: 14000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 11000,
      newBlurb: "A full 10 to 12-piece band drawing from Dallas's deep Texas country, R&B, and Tejano music tradition. Acts at this level bring horn sections, multiple vocalists, and the ability to move between Texas country, classic rock, and soul — performing for corporate galas and touring productions before taking wedding bookings. Gilley's Dallas brings authentic Texas honky-tonk culture to this caliber of entertainment.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 3800, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Dallas, where the music scene spans Texas country, classic rock, Tejano, and R&B. Joy puts Texas live bands at $4,500 average; premium acts with strong DFW wedding entertainment reputations run $4,500 to $9,000.",
    },
  },

  "denver": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 23000, newPriceHighPeak: 30000,
      newPriceLowOffPeak: 15000, newPriceHighOffPeak: 20000,
      newBlurb: "Dunafon Castle in Evergreen — a genuine medieval-style castle in the mountain hillside above Denver — and the most exclusive private ranch estates in the foothills represent Denver's venue apex. Site fees run $23,000 to $30,000 with significant additional production costs: mountain venues require generators, temporary flooring, and tented structures adding $10,000 to $20,000 on top. Reserve 18 months out for peak summer Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 16000, revisedPriceHighPeak: 23000,
      revisedPriceLowOffPeak: 10000, revisedPriceHighOffPeak: 15000,
      revisedBlurb: "The Lumber Baron Inn & Gardens in Curtis Park — an 1879 Victorian mansion in Denver's historic Potter-Highlands neighborhood — and Spruce Mountain Ranch in Larkspur bring Denver's historic estate and scenic ranch tier at $16,000 to $23,000. Castle Marne in Capitol Hill and the Manor House in Littleton round out Denver's historic property category.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer — with engagement session and a premium hand-bound album. Colorado's most celebrated editorial wedding photographers with specific Rocky Mountain estate experience — understanding extraordinary alpine light at altitude, the Dunafon Castle at sunrise, and managing mountain afternoon thunderstorms — run $8,000 to $11,000. At this level your photographer is a Colorado mountain specialist, not a generalist.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Denver wedding day. Wedding.report puts combined photo and video at $4,267 to $5,215 for 125 guests; skilled Denver teams with Rocky Mountain venue experience run $5,500 to $8,000. A second shooter is particularly valuable at mountain venues where ceremony and cocktail hour happen simultaneously in different locations.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 16000, newPriceHighPeak: 22000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 18000,
      newBlurb: "Full-scale floral installation with a couture Colorado mountain aesthetic — rare alpine wildflowers, locally grown peonies and dahlias, architectural dried-grass installations, and ceiling treatments scaled to the dramatic proportions of mountain estate venues. Denver studios operating at this level bring specific expertise in outdoor and semi-outdoor mountain venue logistics.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 9000, revisedPriceHighPeak: 16000,
      revisedPriceLowOffPeak: 7500, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a Colorado mountain aesthetic — wildflowers, Colorado blue columbine, alpine greenery, and dried grasses with installation work scaled to mountain venue proportions. Full installation at a mountain estate or hotel ballroom runs $9,000 to $16,000 at skilled Denver studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 9000, newPriceHighPeak: 14000,
      newPriceLowOffPeak: 7000, newPriceHighOffPeak: 11000,
      newBlurb: "A full 10 to 12-piece band drawing from Denver's Americana, country, bluegrass, and indie rock scene. Acts at this level bring full production specs matched to mountain venue acoustics, multiple vocalists, and the ability to perform multi-genre sets from Colorado country to contemporary hits. A live Americana band in a Denver mountain castle is a distinctly Colorado wedding experience.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 5000, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 4000, revisedPriceHighOffPeak: 7000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Denver, where the music scene spans country, Americana, bluegrass, and indie rock. Joy puts Colorado live bands at $3,500 to $10,000-plus; premium acts with strong wedding entertainment reputations run $5,000 to $9,000.",
    },
  },

  "los-angeles": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 40000, newPriceHighPeak: 55000,
      newPriceLowOffPeak: 30000, newPriceHighOffPeak: 42000,
      newBlurb: "Greystone Mansion & Gardens in Beverly Hills — the iconic 1928 Tudor Revival estate with formal gardens and city-to-ocean views, with peak Saturday rentals at $20,000-plus — and Cielo Farms in Malibu at $18,500 to $22,500 site fees plus required catering from $100 to $500/guest represent LA's apex venue tier. WedStay-class 48-acre estate buyouts run $30,000 to $55,000 for the site alone. These venues appear in architectural publications and host the celebrity-adjacent events that define LA's most exclusive wedding market.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 28000, revisedPriceHighPeak: 40000,
      revisedPriceLowOffPeak: 22000, revisedPriceHighOffPeak: 30000,
      revisedBlurb: "Hummingbird Nest Ranch in Santa Susana Pass and Calamigos Ranch in Malibu Creek represent LA's accessible luxury ranch estate tier. Rancho Las Lomas in Silverado and private estates in Los Feliz and Hancock Park bring film-historic architectural character. Site fees run $28,000 to $40,000 for exclusive Saturday access to these celebrated properties.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 12000, newPriceHighPeak: 16000,
      newPriceLowOffPeak: 9500, newPriceHighOffPeak: 13000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a director-cut feature film and highlight reel. LA's top editorial wedding photographers — those shooting Beverly Hills estate weddings and Malibu ocean-cliffside ceremonies for Style Me Pretty and Vogue Weddings — run $12,000 to $16,000. At this tier your photographer is drawn from the entertainment industry talent pool: editorial and commercial photographers who bring a motion picture visual sensibility to wedding documentation.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 12000,
      revisedPriceLowOffPeak: 6500, revisedPriceHighOffPeak: 9500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Los Angeles wedding day. Skilled LA teams with Beverly Hills hotel, Malibu estate, and Hollywood Hills venue portfolios run $8,000 to $12,000. LA's photogenic abundance — the Pacific at golden hour, the Hollywood Hills, Beverly Hills palm-lined streets — rewards experienced local photographers.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 27000, newPriceHighPeak: 38000,
      newPriceLowOffPeak: 21000, newPriceHighOffPeak: 30000,
      newBlurb: "Full-scale floral design at LA's most celebrated studio level — studios operating with $15,000+ minimums at the Beverly Hills Hotel, Greystone Mansion, and Cielo Farms. Dramatic tropical installations, California garden-rose abundance, and elaborate ceiling treatments that transform Malibu estate spaces. The Los Angeles Flower District, one of America's largest fresh-cut flower markets, supplies some of the rarest seasonal blooms available on the West Coast.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 15000, revisedPriceHighPeak: 27000,
      revisedPriceLowOffPeak: 12000, revisedPriceHighOffPeak: 21000,
      revisedBlurb: "Large-scale floral design at LA's top-tier florist level — studios working with Beverly Hills hotels and Malibu estate properties. Full installation with ceremony installations, ceiling treatments, and full tablescapes runs $15,000 to $27,000. LA's signature aesthetics range from California garden-rose abundance to Mediterranean wildflower arrangements.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11000, newPriceHighOffPeak: 16000,
      newBlurb: "A full 10 to 12-piece band drawing from LA's unmatched musician talent pool — session musicians, working studio professionals, and Grammy-recognized players whose day jobs include recording sessions and touring productions. Acts at this level book Beverly Hills hotel weddings and Malibu celebrity-adjacent events and cover every cultural tradition: classic rock, R&B, Latin, jazz, and the city's Persian-Iranian musical heritage.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 7000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6000, revisedPriceHighOffPeak: 11000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Los Angeles, where the music industry depth is unmatched. Skilled LA wedding bands draw from the city's extraordinary musician talent pool and cover R&B, Motown, Latin, and contemporary hits. Acts with strong Beverly Hills and Malibu wedding entertainment reputations run $7,000 to $14,000.",
    },
  },

  "miami": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 30000, newPriceHighPeak: 42000,
      newPriceLowOffPeak: 17000, newPriceHighOffPeak: 25000,
      newBlurb: "Vizcaya Museum & Gardens — the 1916 Italian Renaissance estate on Biscayne Bay with European gardens, terraces, and waterfront views that have no American equivalent — begins evening wedding rental at $30,000 to $42,000 for the exclusive experience. Private waterfront estates on Star Island and Hibiscus Island, available through residential buyouts, operate at the same altitude. Peak season is November through April; summer is steeply discounted.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 22000, revisedPriceHighPeak: 30000,
      revisedPriceLowOffPeak: 11000, revisedPriceHighOffPeak: 17000,
      revisedBlurb: "The Deering Estate in Cutler Bay — 444 acres with two historic houses and Biscayne Bay frontage — and Casa Casuarina (the former Versace mansion on Ocean Drive, now The Villa by Barton G) bring Miami's private historic estate character at $22,000 to $30,000 during peak season. Both offer the kind of historic Miami architecture and waterfront drama that hotel ballrooms cannot replicate.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer. Miami's top editorial wedding photographers with a specific portfolio of Vizcaya ceremonies, South Beach rooftop golden-hour sessions, and Art Deco architectural detail work run $8,000 to $11,000. At this tier your photographer has shot Vizcaya in every light condition and understands precisely how to work the Bay's extraordinary afternoon glow.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Miami wedding day. Rateven's 2026 Miami data puts the combined photo/video median at $7,435; skilled Miami teams who shoot regularly at Vizcaya-level venues run $5,500 to $8,000. Miami's ocean light and Art Deco architecture attract serious photographic talent.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 17000, newPriceHighPeak: 25000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 20000,
      newBlurb: "Full-scale tropical installation work by Miami's most celebrated floral studios — orchids, birds of paradise, anthuriums, and lush tropical palm installations at a scale that transforms waterfront estates and hotel ballrooms. Studios at this level work with Vizcaya, the Fontainebleau, and 1 Hotel South Beach with significant minimums and multi-month booking windows.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 10000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8000, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a tropical Miami sensibility — orchids, birds of paradise, anthuriums, and tropical palms. Full installation at a waterfront estate or hotel ballroom with ceremony arch and full tablescapes runs $10,000 to $17,000 at skilled Miami studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 12000, newPriceHighPeak: 18000,
      newPriceLowOffPeak: 9500, newPriceHighOffPeak: 14000,
      newBlurb: "A full 10 to 12-piece band drawing from Miami's extraordinarily diverse music culture — Latin jazz, salsa, reggaeton, and the city's Cuban musical heritage. Acts at this level feature world-class salsa vocalists, full horn and percussion sections, and the ability to deliver a full-evening Latin-infused reception at a Biscayne Bay venue that is genuinely transformative wedding entertainment.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 12000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 9500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Miami, where the music culture spans Latin jazz, salsa, reggaeton, and electronic dance music. Premium acts with strong Latin wedding entertainment reputations run $6,000 to $12,000. A live salsa or Cuban jazz band at a Biscayne Bay venue is genuinely transformative.",
    },
  },

  "minneapolis": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 18000, newPriceHighPeak: 24000,
      newPriceLowOffPeak: 12000, newPriceHighOffPeak: 17000,
      newBlurb: "The American Swedish Institute's Turnblad Mansion — 33 rooms of castle-like Scandinavian design on Park Avenue, a National Historic Landmark — and Semple Mansion in Loring Park (the state's largest original residential ballroom with Swarovski crystal chandeliers and restored fresco paintings) represent the apex of the Minneapolis historic venue market. Full Saturday buyouts run $18,000 to $24,000 for exclusive access.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 18000,
      revisedPriceLowOffPeak: 8000, revisedPriceHighOffPeak: 12000,
      revisedBlurb: "The Gale Mansion in South Minneapolis (1912, National Registry of Historic Places) and Van Dusen Mansion — a Queen Anne Victorian in Lowry Hill — represent the Twin Cities' historic mansion tier at site fees of $12,000 to $18,000. These properties bring genuine 19th-century architectural character to Minneapolis wedding celebrations.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a dedicated cinematographer — with engagement session and premium album. The Twin Cities' most celebrated editorial wedding photographers with deep portfolio experience at Semple Mansion, the Gale Mansion, and the ASI Turnblad Mansion run $8,000 to $11,000. At this tier your photographer understands the particular quality of Minneapolis winter light through Tiffany glass and the long golden hours of midsummer on Lake Minnetonka.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Minneapolis wedding day. Sea Circus Weddings puts Minneapolis mansion-venue photography starting at $5,500 including film and second photographer; skilled Twin Cities teams with strong mansion venue portfolios run $5,500 to $8,000.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11500, newPriceHighOffPeak: 16000,
      newBlurb: "Full-scale installation work by Minneapolis's most celebrated floral studios — elaborate ceremony arches, ceiling installations at the Turnblad Mansion scale, and full tablescapes featuring Minnesota peonies (a local specialty during the short June–July season), locally grown dahlias, and prairie grasses. Studios at this level carry specific ASI and Semple Mansion credentials.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6500, revisedPriceHighOffPeak: 11500,
      revisedBlurb: "Large-scale floral design with an Upper Midwest sensibility — locally grown peonies, garden roses, dahlias, and prairie grasses with installation work scaled to grand historic mansion venues. Full installation at Semple Mansion or comparable properties runs $8,000 to $14,000 at skilled Minneapolis studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 9000, newPriceHighPeak: 13000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10500,
      newBlurb: "A full 10 to 12-piece band drawing from Minneapolis's extraordinary musical heritage — the birthplace of Prince, with deep traditions in funk, indie rock, and Americana. Acts at this level perform for corporate events and bring full horn sections, multiple vocalists, and the ability to pay genuine homage to Minneapolis's Prince-influenced funk tradition. A marquee funk band at a Twin Cities mansion venue is a specifically Minneapolis experience.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 3800, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Minneapolis, where the music scene is extraordinary — the birthplace of Prince, with deep funk, indie rock, and Americana traditions. Premium acts with strong Minneapolis wedding entertainment reputations run $4,500 to $9,000.",
    },
  },

  "nashville": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 25000, newPriceHighPeak: 32000,
      newPriceLowOffPeak: 19000, newPriceHighOffPeak: 25000,
      newBlurb: "Cheekwood Estate & Gardens — 55 acres of nationally recognized botanical gardens in Belle Meade with multiple event spaces, glass-walled restaurant, and formal garden terraces — represents Nashville's venue apex at $10,000 to $15,000 site fee for full-day access. Both Cheekwood and Riverwood Mansion on the Cumberland River book 12 to 18 months out for October Saturdays. Full estate events here regularly reach $50,000 to $80,000 once catering and production are built out.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 18000, revisedPriceHighPeak: 25000,
      revisedPriceLowOffPeak: 14000, revisedPriceHighOffPeak: 19000,
      revisedBlurb: "Riverwood Mansion on the Cumberland River ($8,000 to $12,000 site fee) and Ravenswood Mansion in Brentwood represent the historic estate tier complementing Cheekwood. These properties bring Tennessee river estate character — stone architecture, terraced lawns, mature trees — at site fees of $18,000 to $25,000 for Saturday exclusive access.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 7500, newPriceHighPeak: 10000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 8500,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film. Nashville's most sought-after wedding photographers — those who work regularly at Cheekwood, Riverwood Mansion, and the Hermitage Hotel, and whose work appears in Nashville Lifestyles and Style Me Pretty — run $7,500 to $10,000. At this tier your photographer has pre-visualized the quality of Tennessee October light against a Cheekwood garden backdrop.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 7500,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Nashville wedding day. Wedding.report puts Nashville photography and video combined at $4,145 to $6,075; skilled Nashville teams with estate and barn venue portfolios run $5,500 to $7,500. A second shooter is particularly valuable at multi-space venues where ceremony and reception happen simultaneously.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 21000, newPriceHighPeak: 30000,
      newPriceLowOffPeak: 17000, newPriceHighOffPeak: 25000,
      newBlurb: "Full-scale transformation of Nashville's estate and barn venues by the city's most celebrated floral studios — ceiling installations in the Loveless Barn's chandelier-hung main hall, elaborate ceremony arches against Cheekwood's garden walls, and full tablescapes with tall centerpieces using rare imported blooms. Studios at this level carry $12,000+ minimums for Cheekwood-level event work.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 12000, revisedPriceHighPeak: 21000,
      revisedPriceLowOffPeak: 10000, revisedPriceHighOffPeak: 17000,
      revisedBlurb: "Large-scale floral design that transforms Nashville's estate and barn venues — ceremony arches against Cheekwood's garden walls, lush tablescapes, full reception florals. Skilled Nashville studios with strong Riverwood Mansion and estate venue portfolios run $12,000 to $21,000.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11000, newPriceHighOffPeak: 16000,
      newBlurb: "Nashville is Music City, and at this tier you access the deepest live wedding entertainment talent pool in America. A full 10 to 12-piece band — vocalist, rhythm section, full horns — drawing from musicians who perform at The Bluebird Cafe and on Lower Broadway. Heck Designs puts the upper end of Nashville bands at $10,000-plus; $14,000 to $20,000 is where the marquee acts with touring-level production specs begin. Book 12 months out for October.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6500, revisedPriceHighOffPeak: 11000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Nashville, where the talent pool is deeper and the quality ceiling higher than almost anywhere in the country. Heck Designs puts Nashville live bands at $4,000 to $10,000-plus; premium acts with strong wedding entertainment reputations run $8,000 to $14,000. Book 12 months out for October Saturdays.",
    },
  },

  "new-orleans": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 19000, newPriceHighPeak: 25000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 18000,
      newBlurb: "Derbès Mansion on Esplanade and the Elms Mansion in the Garden District — both meticulously preserved 19th-century grand homes — and House of Broel on St. Charles Avenue (a Victorian double mansion built in 1850) put you inside New Orleans' living history at the most exclusive level. Full-estate buyouts run $19,000 to $25,000 for the site fee with exclusive access to historic rooms, gardens, and grounds.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 13000, revisedPriceHighPeak: 19000,
      revisedPriceLowOffPeak: 9500, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Southern Oaks Plantation — which has hosted receptions for three decades — and the Columns Hotel on St. Charles Avenue represent New Orleans' historic venue tier below full mansion buyouts. Authentic grand verandas, live oak grounds, and antebellum architecture at site fees of $13,000 to $19,000. Complete event costs including catering run $30,000 to $50,000 for 150 guests.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 7500, newPriceHighPeak: 10000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 8500,
      newBlurb: "Lead photographer, second photographer, and a cinematographer — with dedicated second-line parade coverage from two simultaneous angles. New Orleans' most celebrated wedding photographers who understand the specific light of a French Quarter courtyard, the joy of the second line in the streets, and the visual richness of a Garden District mansion at dusk run $7,500 to $10,000. Chad Populis Photography and Amin Russell Photography are among this city's acknowledged specialists.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 7500,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full New Orleans wedding day — including second line coverage. Mid-range full-day packages run $3,500 to $6,500; skilled in-demand studios with second line and Garden District experience run $5,500 to $7,500. Second line parade coverage requires specific local experience.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 17000, newPriceHighPeak: 25000,
      newPriceLowOffPeak: 14000, newPriceHighOffPeak: 20000,
      newBlurb: "Full-scale floral design in the New Orleans couture style — lush, layered, theatrical, rooted in French and Spanish colonial history. Rare magnolia branches, jasmine cascades, anthurium, and tropical blooms combined with elaborate iron-balcony rail treatments, ceremony arch installations, and full tablescapes. Studios at this level carry $12,000+ minimums for mansion-level event work.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 10000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8500, revisedPriceHighOffPeak: 14000,
      revisedBlurb: "Large-scale floral design in the New Orleans style — magnolia branches, jasmine, anthurium, and tropical blooms with full ceremony and reception installations. Full installation at a historic mansion or hotel ballroom runs $10,000 to $17,000 at skilled New Orleans studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 11000, newPriceHighPeak: 16000,
      newPriceLowOffPeak: 9000, newPriceHighOffPeak: 13000,
      newBlurb: "New Orleans is the birthplace of jazz, and wedding entertainment here is unlike anywhere in the country. A full 10 to 12-piece jazz or brass band for the evening, plus second line parade — a couple leading guests through the streets with handkerchiefs and parasols — with police escort and route coordination. At this tier you access New Orleans' most celebrated brass and jazz acts. Second line adds $800 to $1,200 for the band plus permits and escorts.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 11000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 9000,
      revisedBlurb: "A full reception jazz or brass band of 6 to 8 musicians in New Orleans, where live music and the second line tradition are unlike anywhere else. Full reception band plus second line combination runs $6,000 to $11,000 including the band's parade fee. City permit ($100) and police escort ($400 to $600) are separate.",
    },
  },

  "new-york-city": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 110000, newPriceHighPeak: 150000,
      newPriceLowOffPeak: 85000, newPriceHighOffPeak: 120000,
      newBlurb: "The Rainbow Room at 30 Rock, The Plaza, and Cipriani 42nd Street represent a category unto themselves — not venues you book but institutions you gain access to. Food and beverage minimums at the Rainbow Room start at $90,000; combined venue fee and minimum spend at The Plaza and Cipriani regularly reach $150,000-plus before a single vendor is hired. These spaces come with dedicated events directors, in-house production infrastructure, and a hundred years of Manhattan wedding history. Book 18 to 24 months out.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 80000, revisedPriceHighPeak: 110000,
      revisedPriceLowOffPeak: 60000, revisedPriceHighOffPeak: 85000,
      revisedBlurb: "The New York Public Library's Astor Hall and Rose Main Reading Room, Gotham Hall in the former Greenwich Savings Bank, and Capitale at 130 Bowery Street represent historic Manhattan event spaces below the Rainbow Room/Plaza apex. Site fees and F&B minimums combined run $80,000 to $110,000; they deliver landmark architectural character with slightly more accessible booking windows — still 12 to 18 months out for Saturdays.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 13000, newPriceHighPeak: 18000,
      newPriceLowOffPeak: 10000, newPriceHighOffPeak: 15000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film and highlight reel — with engagement session and a premium leather-bound album. Photographers like Sam Hurd, Christian Oth Studio, and KT Merry — whose work appears in Vogue Weddings — run $13,000 to $18,000 for the complete package. What you hire is a visual legacy: photographers with specific Rainbow Room and Cipriani experience who know exactly where to stand during the first dance to catch the 30 Rock skyline.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 13000,
      revisedPriceLowOffPeak: 7000, revisedPriceHighOffPeak: 10000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full NYC wedding day. Christian Oth's studio starts at $8,500 for photography alone; skilled NYC teams with landmark venue experience run $8,000 to $13,000. Manhattan's iconic architectural backdrop rewards photographers with deep local experience.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 38000, newPriceHighPeak: 60000,
      newPriceLowOffPeak: 32000, newPriceHighOffPeak: 50000,
      newBlurb: "In NYC this means studios like Putnam & Putnam (whose work appears on the cover of Vogue Weddings) and Jeff Leatham Florals (Four Seasons' signature designer). Putnam & Putnam's minimum for a full installation wedding is $20,000 to $25,000; full ceiling installations at Capitale or the NYC Public Library run $40,000 to $60,000 before catering and venue. These studios are booked 12 to 18 months out for peak-season events.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 20000, revisedPriceHighPeak: 38000,
      revisedPriceLowOffPeak: 18000, revisedPriceHighOffPeak: 32000,
      revisedBlurb: "Large-scale floral design that transforms the space — ceiling installations, floral walls, oversized ceremony arches, and lush tablescapes by leading NYC studios. Full installation work at landmark venues by established NYC florists runs $20,000 to $38,000 before the Putnam & Putnam and Jeff Leatham level.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 24000, newPriceHighPeak: 35000,
      newPriceLowOffPeak: 18000, newPriceHighOffPeak: 28000,
      newBlurb: "A full 10 to 12-piece band with vocalist, horn section, and full rhythm section — Hank Lane Music's tier of bands that perform regularly at The Plaza and Cipriani. Bandwidth Entertainment puts the NYC average for a live wedding band at $10,000 to $20,000; $24,000 to $35,000 is where the marquee acts begin — the 12-piece big band with horns that covers Sinatra to Beyoncé without blinking. For the Rainbow Room or Cipriani, a live band isn't optional — it's what the room was designed for.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 15000, revisedPriceHighPeak: 24000,
      revisedPriceLowOffPeak: 12000, revisedPriceHighOffPeak: 18000,
      revisedBlurb: "A full reception band of 6 to 8 musicians for a NYC wedding — soul group, jazz ensemble, or contemporary cover band. Bandwidth Entertainment puts the NYC average for live wedding bands at $10,000 to $20,000; skilled acts with Manhattan landmark venue experience run $15,000 to $24,000.",
    },
  },

  "philadelphia": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 22000, newPriceHighPeak: 28000,
      newPriceLowOffPeak: 15000, newPriceHighOffPeak: 20000,
      newBlurb: "Cairnwood Estate in Bryn Athyn — a castle-like 1890s National Historic Landmark mansion with BYOB catering policy, 30 minutes north of Philadelphia — and Glen Foerd on the Delaware River represent Philly's apex venue tier. The Rodin Museum on Benjamin Franklin Parkway offers a 5-hour event rental for $10,250 with catering by Constellation Culinary Group from $360/person plated. Full estate events run $22,000 to $28,000 for site access.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 16000, revisedPriceHighPeak: 22000,
      revisedPriceLowOffPeak: 11000, revisedPriceHighOffPeak: 15000,
      revisedBlurb: "Merion Tribute House (a Gothic Revival stone castle on the Main Line, $4,500 to $6,000 for Saturday peak) and Haverford College's Founders Hall represent Philadelphia's accessible historic landmark tier at site fees of $16,000 to $22,000. The Union League of Philadelphia and comparable Main Line estate properties round out this range.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 9000, newPriceHighPeak: 12000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film — with engagement session and premium album. Philadelphia's top editorial wedding photographers who work regularly at Cairnwood Estate, the Rodin Museum, and Union Trust — and whose work appears in Philadelphia Style — run $9,000 to $12,000. At this tier your photographer brings specific experience with the Barnes Foundation's symmetry, the Schuylkill at golden hour, and the extraordinary Beaux-Arts architecture of Center City.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Philadelphia wedding day. Joy's Philadelphia data puts premium photographers at $5,000-plus; skilled Philadelphia teams with estate and museum venue portfolios run $6,000 to $9,000. Philadelphia's historic architecture — Beaux-Arts buildings, the Art Museum steps, Independence Hall — offers extraordinary backdrop options.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 17000, newPriceHighPeak: 24000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 19000,
      newBlurb: "Full-scale installation work at Union Trust, the Rodin Museum, and Cairnwood Estate — elaborate ceremony arches, ceiling installations, and full tablescapes using locally grown peonies and dahlias from Pennsylvania Dutch country flower farms. Philadelphia's most celebrated floral studios bring couture-level design to the city's historic ballrooms and museum spaces.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 10000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8000, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a Mid-Atlantic sensibility — locally grown peonies and dahlias from Pennsylvania Dutch country, hydrangeas, and seasonal blooms with installation work scaled to historic ballroom venues. Full installation at Union Trust or Cairnwood Estate runs $10,000 to $17,000 at skilled Philadelphia studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 11000, newPriceHighPeak: 16000,
      newPriceLowOffPeak: 9000, newPriceHighOffPeak: 13000,
      newBlurb: "A full 10 to 12-piece band drawing from Philadelphia's deep Philly soul, jazz, and R&B tradition — the musical lineage of Gamble and Huff and the O'Jays, combined with the Philadelphia Orchestra's deep freelance bench. Acts at this level bring horn sections, multiple vocalists, and the ability to perform the full Philly soul canon. A Philly soul revue at a Center City historic venue is a genuinely specific Philadelphia experience.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 11000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 9000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Philadelphia, where the music culture spans Philly soul, jazz, R&B, indie rock, and classical. Premium acts with strong Philadelphia wedding entertainment reputations run $5,500 to $11,000.",
    },
  },

  "phoenix": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 24000, newPriceHighPeak: 32000,
      newPriceLowOffPeak: 9500, newPriceHighOffPeak: 15000,
      newBlurb: "The Arizona Biltmore — a 1929 Frank Lloyd Wright-influenced resort and Phoenix's most iconic wedding property — and The Phoenician in Scottsdale represent the apex of the Phoenix luxury venue market. Complete packages at these properties run $32,000-plus for 150 guests. Phoenix flips the seasonal pattern: peak is October to April; summer (May–September) is steeply discounted as afternoon highs regularly exceed 105°F. Book 12 months out for peak-season Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 16000, revisedPriceHighPeak: 24000,
      revisedPriceLowOffPeak: 5500, revisedPriceHighOffPeak: 9500,
      revisedBlurb: "The Scottsdale Resort at McCormick Ranch and private estate buyouts in Paradise Valley and Arcadia represent the luxury estate tier below the Biltmore and Phoenician apex. JW Marriott Camelback Inn's garden buyouts and Desert Botanical Garden private events also operate here at $16,000 to $24,000 during peak season.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 8000, newPriceHighPeak: 11000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 9000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer. Arizona's top editorial wedding photographers who work regularly at the Biltmore, Desert Botanical Garden, and the Scottsdale private estate circuit — with Sonoran Desert landscape mastery and Camelback Mountain golden-hour expertise — run $8,000 to $11,000. At this tier your photographer is a desert specialist with a pre-visualized approach to saguaro silhouettes at sunset.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Phoenix or Scottsdale wedding day. Complete Weddings + Events puts Arizona average photographer at $2,900; skilled Phoenix-Scottsdale teams with Biltmore and estate venue portfolios run $5,500 to $8,000.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11500, newPriceHighOffPeak: 16000,
      newBlurb: "Full-scale floral design with a couture Sonoran sensibility — incorporating rare desert native plants as architectural elements, locally grown peonies and garden roses, and bold Southwestern color palettes (terracotta, sage, dusty rose) combined with elaborate ceremony installations. Phoenix-Scottsdale's most celebrated studios work with the Biltmore and Phoenician with significant minimums.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6500, revisedPriceHighOffPeak: 11500,
      revisedBlurb: "Large-scale floral design with a Sonoran sensibility — desert native plants, locally grown peonies and roses, and bold Southwestern color palettes. Full installation at the Biltmore or comparable luxury resort runs $8,000 to $14,000 at skilled Phoenix-Scottsdale studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 9000, newPriceHighPeak: 13000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10500,
      newBlurb: "A full 10 to 12-piece band drawing from Phoenix's Mexican-American banda and norteño traditions, Western swing, and the Phoenix-Tempe indie rock scene. Acts at this level bring full brass and accordion sections for norteño or banda, or full horn sections for R&B and soul, and perform for corporate resort events at the Biltmore and Phoenician before taking wedding bookings.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 3800, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Phoenix, where the music culture spans Mexican-American banda, norteño, country, Western swing, and indie rock. Premium acts with strong Phoenix wedding entertainment reputations run $4,500 to $9,000.",
    },
  },

  "san-francisco": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 52000, newPriceHighPeak: 70000,
      newPriceLowOffPeak: 38000, newPriceHighOffPeak: 52000,
      newBlurb: "Filoli in Woodside — a 16-acre early 20th-century estate with formal English gardens, starting at $65,000 for six hours of evening event time before catering, tenting, or any vendors — and the SF Mint (the 'Granite Lady,' a National Historic Landmark with 52,000 square feet of ornate ballrooms) represent San Francisco's most exclusive wedding venues. Both require approved planners, approved caterers, and book 18-plus months out.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 35000, revisedPriceHighPeak: 52000,
      revisedPriceLowOffPeak: 25000, revisedPriceHighOffPeak: 38000,
      revisedBlurb: "The Presidio Officers' Club overlooking the Golden Gate, private Pacific Heights mansion buyouts, and the Julia Morgan Ballroom at the Merchants Exchange Building represent the SF estate tier below Filoli and the SF Mint. The Carnelian Room atop the Bank of America Center and comparable landmark properties operate at $35,000 to $52,000 for Saturday exclusive access.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 10500, newPriceHighPeak: 14000,
      newPriceLowOffPeak: 8500, newPriceHighOffPeak: 12000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film — with engagement session and premium fine-art album. San Francisco's most celebrated wedding photographers who work regularly at Filoli, the Fairmont, and the Presidio — who know how to navigate afternoon fog, capture the Golden Gate in four different light conditions, and produce work in Brides and Vogue Weddings — run $10,500 to $14,000. At this tier you hire one of the Bay Area's acknowledged masters of SF's visual complexity.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 7000, revisedPriceHighPeak: 10500,
      revisedPriceLowOffPeak: 6000, revisedPriceHighOffPeak: 8500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full San Francisco wedding day. Zola notes nearly 55% of SF couples prioritize their photographer above all other categories; skilled SF teams who work at Filoli, the Fairmont, and Presidio run $7,000 to $10,500. Elev8 puts Bay Area photographers at $4,000 to $8,000 for full-day coverage.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 25000, newPriceHighPeak: 35000,
      newPriceLowOffPeak: 20000, newPriceHighOffPeak: 28000,
      newBlurb: "Full-scale installation work by San Francisco's most celebrated floral studios drawing from the SF Flower Mart (the largest flower market on the West Coast) — California native plants, eucalyptus, rare seasonal imports, and garden-inspired ceiling installations that complement the city's Arts and Crafts and Beaux-Arts architectural character. Studios at this level carry $15,000+ minimums for Filoli-level event work.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 15000, revisedPriceHighPeak: 25000,
      revisedPriceLowOffPeak: 12000, revisedPriceHighOffPeak: 20000,
      revisedBlurb: "Large-scale floral design with a Northern California sensibility — locally grown seasonal flowers from the SF Flower Mart, California natives, eucalyptus, and garden-inspired installations. Zola puts SF florals at approximately $11,000 at typical scale; full installation at Filoli or the Fairmont runs $15,000 to $25,000 at skilled studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11000, newPriceHighOffPeak: 16000,
      newBlurb: "A full 10 to 12-piece band drawing from the Bay Area's extraordinary jazz, soul, and hip-hop heritage — a music scene that produced Carlos Santana, Journey, and the Bay Area hip-hop tradition. Acts at this level perform for corporate galas at the Fairmont and St. Regis and bring full horn sections, multiple vocalists, and the ability to cover the full Bay Area musical spectrum from jazz standards to contemporary R&B.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 7000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 6000, revisedPriceHighOffPeak: 11000,
      revisedBlurb: "A full reception band of 6 to 8 musicians in San Francisco, where the music culture spans jazz, soul, indie rock, and the Bay Area's hip-hop heritage. Premium acts running full receptions at Fairmont-level venues run $7,000 to $14,000. Bay Area jazz and soul bands that capture the city's musical identity bring genuine local character.",
    },
  },

  "savannah": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 17000, newPriceHighPeak: 22000,
      newPriceLowOffPeak: 12000, newPriceHighOffPeak: 16000,
      newBlurb: "The Mackey House — a 150-acre exclusive Lowcountry estate buyout with Georgia pines in Spanish moss — and antebellum plantation buyouts on the river and barrier islands represent Savannah's apex venue tier. Site fees run $17,000 to $22,000 for full exclusive access to the grounds and historic structures; full estate events reach $40,000 to $70,000-plus once catering, tenting, and production are built out.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 13000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 9000, revisedPriceHighOffPeak: 12000,
      revisedBlurb: "The Gastonian on Gaston Street — two meticulously restored Regency-period homes with charming gardens — and the Andrew Low House on Lafayette Square anchor Savannah's historic mansion tier at site fees of $13,000 to $17,000. Private historic district homes on Jones Street available for exclusive buyouts bring authentic Savannah residential character.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 7000, newPriceHighPeak: 9500,
      newPriceLowOffPeak: 6000, newPriceHighOffPeak: 8000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer. Savannah's most celebrated editorial wedding photographers with deep portfolio experience at the Mackey House, Forsyth Park Spanish moss ceremonies, and Wormsloe's live oak tunnel at golden hour run $7,000 to $9,500. At this tier your photographer understands the specific quality of Lowcountry afternoon light through live oaks and the way the Savannah River shimmers at sunset.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 5000, revisedPriceHighPeak: 7000,
      revisedPriceLowOffPeak: 4000, revisedPriceHighOffPeak: 6000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Savannah wedding day. Wedding.report puts combined photo and video at $5,441 to $6,650 at the upper tier; skilled Savannah teams with editorial-level portfolios at historic venues run $5,000 to $7,000. Wormsloe's live oak tunnel and Forsyth Park give skilled photographers extraordinary material.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 14000, newPriceHighPeak: 20000,
      newPriceLowOffPeak: 11000, newPriceHighOffPeak: 16000,
      newBlurb: "Full-scale installation work by Savannah's most celebrated floral studios — magnolia branches, camellias, jasmine, and Georgia wildflowers combined with elaborate ceremony installations, ceiling treatments, and tablescapes that bring the coastal Georgia botanical landscape indoors at the Mackey House estate scale.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 8000, revisedPriceHighPeak: 14000,
      revisedPriceLowOffPeak: 7000, revisedPriceHighOffPeak: 11000,
      revisedBlurb: "Large-scale floral design with a coastal Georgia sensibility — magnolia branches, camellias, jasmine, and Georgia wildflowers alongside ceremony installations and elaborate tablescapes. Full installation at the Mackey House or Westin Harbor ballroom runs $8,000 to $14,000 at skilled Savannah studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 8000, newPriceHighPeak: 12000,
      newPriceLowOffPeak: 6500, newPriceHighOffPeak: 10000,
      newBlurb: "A full 10 to 12-piece band drawing from Savannah's jazz and blues heritage along River Street, augmented by Atlanta-based acts that regularly work Savannah venues. Acts at this level bring full horn sections, multiple vocalists, and production specs matched to estate venue acoustics. A marquee jazz or soul band in a Savannah historic venue is distinctly Lowcountry wedding entertainment.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 4500, revisedPriceHighPeak: 8000,
      revisedPriceLowOffPeak: 3500, revisedPriceHighOffPeak: 6500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Savannah, where live music has deep roots in jazz and blues along River Street. Wedding.report puts Savannah live band spend at $3,232 to $3,950 on average; premium acts run $4,500 to $8,000. Savannah's proximity to Atlanta broadens the available talent pool.",
    },
  },

  "seattle": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 23000, newPriceHighPeak: 30000,
      newPriceLowOffPeak: 16000, newPriceHighOffPeak: 20000,
      newBlurb: "Dunn Gardens — a 1915 Olmsted Brothers-designed historic landscape garden with mature Pacific Northwest plantings on 7.5 acres, available exclusively for private events — and the most exclusive private estate buyouts overlooking the Puget Sound represent Seattle's apex venue tier. Site fees for exclusive Saturday access run $23,000 to $30,000 for the most celebrated properties. Book 12 to 18 months out for peak summer Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 16000, revisedPriceHighPeak: 23000,
      revisedPriceLowOffPeak: 11000, revisedPriceHighOffPeak: 16000,
      revisedBlurb: "Gray Bridge — a 16-acre private estate in Sultan with meticulously designed outdoor spaces — and Fox Hollow Farm by Landmark Event Co. in the Cascade Mountain foothills bring Seattle's historic country estate character at site fees of $16,000 to $23,000. These properties offer the Pacific Northwest estate aesthetic — mature conifers, mountain views, crafted architecture — at a more accessible scale.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 9000, newPriceHighPeak: 12000,
      newPriceLowOffPeak: 7500, newPriceHighOffPeak: 10000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer producing a feature film. Seattle's most celebrated editorial wedding photographers who work regularly at Dunn Gardens, the Four Seasons, and PNW estate venues — who understand how to capture moody Pacific Northwest light, Olympic Mountain backdrops, and the city's waterfront — run $9,000 to $12,000. WeddingBudgetCalc notes the tech-wealth effect calibrates Seattle's photography market upward.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 6000, revisedPriceHighPeak: 9000,
      revisedPriceLowOffPeak: 5000, revisedPriceHighOffPeak: 7500,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full Seattle wedding day. Wedding.report puts combined photo and video at $5,508 to $7,357 for 75 guests; skilled Seattle teams who understand the moody Pacific Northwest light and PNW estate venues run $6,000 to $9,000.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 17000, newPriceHighPeak: 25000,
      newPriceLowOffPeak: 13000, newPriceHighOffPeak: 20000,
      newBlurb: "Full-scale installation work by Seattle's most celebrated floral studios — elaborate ceremony arches, ceiling greens using locally grown dahlias (Washington is one of the world's top dahlia-growing regions), ferns, Oregon grape, and cedar boughs at the scale that transforms estate venue spaces. Studios at this level carry specific Dunn Gardens and Four Seasons credentials.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 10000, revisedPriceHighPeak: 17000,
      revisedPriceLowOffPeak: 8000, revisedPriceHighOffPeak: 13000,
      revisedBlurb: "Large-scale floral design with a Pacific Northwest sensibility — locally grown dahlias, ferns, Oregon grape, cedar boughs, and lush green installations. Full installation at an estate venue or hotel ballroom with ceremony arch, ceiling greens, and full tablescapes runs $10,000 to $17,000 at skilled Seattle studios.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 10000, newPriceHighPeak: 15000,
      newPriceLowOffPeak: 8500, newPriceHighOffPeak: 12000,
      newBlurb: "A full 10 to 12-piece band drawing from Seattle's indie rock, folk, jazz, and grunge heritage music scene. Acts at this level perform for Four Seasons and Edgewater corporate events and bring full production specs that handle both intimate Dunn Gardens ceremonies and large estate barn receptions. WeddingBudgetCalc's tech-wealth calibration pushes premium Seattle acts to the top of Pacific Northwest wedding entertainment pricing.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 5500, revisedPriceHighPeak: 10000,
      revisedPriceLowOffPeak: 4500, revisedPriceHighOffPeak: 8500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in Seattle, where the music scene encompasses indie rock, folk, jazz, and the city's strong R&B tradition. Wedding.report puts Seattle live band spend at $4,396 to $5,372 on average; premium acts running full receptions at Four Seasons or Edgewater-level venues run $5,500 to $10,000.",
    },
  },

  "washington-dc": {
    venue: {
      newName: "Iconic Estate / Landmark Institution",
      newPriceLowPeak: 32000, newPriceHighPeak: 42000,
      newPriceLowOffPeak: 22000, newPriceHighOffPeak: 30000,
      newBlurb: "The Cosmos Club in Kalorama — a Gilded Age mansion on Massachusetts Avenue with embassy-row gravitas — and Dumbarton House in Georgetown (1799, National Trust for Historic Preservation) represent DC's most exclusive private event spaces. Full-estate Saturday buyouts run $32,000 to $42,000 for exclusive access; total event costs for 150 guests at an Embassy Row-level property regularly reach $80,000 to $150,000. Reserve 18 months out for spring cherry blossom and fall peak Saturdays.",
      revisedName: "Private Estate / Historic Mansion",
      revisedPriceLowPeak: 22000, revisedPriceHighPeak: 32000,
      revisedPriceLowOffPeak: 15000, revisedPriceHighOffPeak: 22000,
      revisedBlurb: "Meridian House on 16th Street (a 1921 French-inspired mansion on three acres, $10,000 to $12,000 for 100 guests) and the Larz Anderson House on Embassy Row ($12,000 to $16,000 site fee) represent DC's storied historic mansion tier. The Anderson House's 50-foot hall and marble columns set the stage for architecturally significant private weddings at total costs of $40,000 to $80,000 for 150 guests.",
    },
    photography: {
      newName: "Luxury Editorial Team",
      newPriceLowPeak: 11000, newPriceHighPeak: 16000,
      newPriceLowOffPeak: 9000, newPriceHighOffPeak: 13000,
      newBlurb: "Lead photographer, second photographer, and a cinematographer — with engagement session and premium fine-art album. DC's top editorial wedding photographers with specific experience at Embassy Row mansions, the National Mall at golden hour, and the April cherry blossom cycle — photographers whose work appears in Washingtonian Weddings and national bridal publications — run $11,000 to $16,000. Blue Sapphire Events puts luxury DC photographers at $15,000 and up.",
      revisedName: "Lead + Second Shooter + Full Video",
      revisedPriceLowPeak: 7000, revisedPriceHighPeak: 11000,
      revisedPriceLowOffPeak: 6000, revisedPriceHighOffPeak: 9000,
      revisedBlurb: "A lead photographer, second shooter, and videography team for a full DC wedding day. Blue Sapphire Events puts DC photography at $7,000 to $10,000 for experienced professionals; skilled DC teams with mansion and National Mall portfolio experience run $7,000 to $11,000. Washington's monumental architecture and the Lincoln Memorial at golden hour make DC one of America's most photogenic wedding markets.",
    },
    florals: {
      newName: "Couture Floral Design",
      newPriceLowPeak: 27000, newPriceHighPeak: 40000,
      newPriceLowOffPeak: 21000, newPriceHighOffPeak: 32000,
      newBlurb: "Full-scale installation work at DC's most celebrated floral studio level. Blue Sapphire Events puts DC florist minimums at $5,000 to $7,500 across established studios; the top tier — studios working at Meridian House, the Willard, and comparable landmark properties with elaborate ceremony installations, ceiling treatments, and full tablescapes — runs $27,000 to $40,000.",
      revisedName: "Full Floral Installation",
      revisedPriceLowPeak: 15000, revisedPriceHighPeak: 27000,
      revisedPriceLowOffPeak: 12000, revisedPriceHighOffPeak: 21000,
      revisedBlurb: "Large-scale floral design at DC's top-tier studio level. Wedding.report puts DC floral spend at $3,794 to $6,761 on average; skilled DC studios with full installation capabilities at Meridian House, Larz Anderson, and comparable landmark properties run $15,000 to $27,000.",
    },
    music: {
      newName: "Premium Live Band (10–12 Piece)",
      newPriceLowPeak: 12000, newPriceHighPeak: 18000,
      newPriceLowOffPeak: 9500, newPriceHighOffPeak: 14000,
      newBlurb: "A full 10 to 12-piece band drawing from DC's go-go tradition (the city's homegrown musical form), jazz, R&B, and the international sounds of the diplomatic community. Acts at this level perform for State Department events and embassy functions — the kinds of bands that understand how to read an internationally diverse crowd and perform a full evening of music at an Embassy Row mansion.",
      revisedName: "Live Band (6–8 Piece)",
      revisedPriceLowPeak: 6500, revisedPriceHighPeak: 12000,
      revisedPriceLowOffPeak: 5500, revisedPriceHighOffPeak: 9500,
      revisedBlurb: "A full reception band of 6 to 8 musicians in DC, where the music scene spans go-go, jazz, R&B, classical, and the international sounds of the diplomatic community. Wedding.report puts DC live band spend at $4,382 to $5,356 on average; premium acts with strong DC wedding entertainment reputations run $6,500 to $12,000.",
    },
  },
};

// ─── Execute ──────────────────────────────────────────────────────────────────

const CATEGORIES = ["venue", "photography", "florals", "music"] as const;

const insertTier = db.prepare(`
  INSERT INTO Tier
    (destinationId, category, tierName, tierOrder, pricingType,
     priceLowPeak, priceHighPeak, priceLowOffPeak, priceHighOffPeak, blurb)
  VALUES
    (@destinationId, @category, @tierName, @tierOrder, @pricingType,
     @priceLowPeak, @priceHighPeak, @priceLowOffPeak, @priceHighOffPeak, @blurb)
`);

const shiftTierOrders = db.prepare(`
  UPDATE Tier SET tierOrder = tierOrder + 1
  WHERE destinationId = @destinationId AND category = @category AND tierOrder >= 1
`);

const updateTierByOrder = db.prepare(`
  UPDATE Tier SET
    tierName = @tierName,
    priceLowPeak = @priceLowPeak, priceHighPeak = @priceHighPeak,
    priceLowOffPeak = @priceLowOffPeak, priceHighOffPeak = @priceHighOffPeak,
    blurb = @blurb
  WHERE destinationId = @destinationId AND category = @category AND tierOrder = @tierOrder
`);

const getDestId = db.prepare(`SELECT id FROM Destination WHERE slug = ?`);
const getPricingType = db.prepare(`SELECT pricingType FROM Tier WHERE destinationId = ? AND category = ? AND tierOrder = 1`);

let totalInserted = 0;

const run = db.transaction(() => {
  for (const [slug, splits] of Object.entries(SPLITS)) {
    const dest = getDestId.get(slug) as { id: number } | undefined;
    if (!dest) { console.warn(`Skipping unknown slug: ${slug}`); continue; }

    for (const cat of CATEGORIES) {
      const split = splits[cat];
      const pricingTypeRow = getPricingType.get(dest.id, cat) as { pricingType: string } | undefined;
      const pricingType = pricingTypeRow?.pricingType ?? "flat";

      // 1. Shift all existing tiers for this category down by 1
      shiftTierOrders.run({ destinationId: dest.id, category: cat });

      // 2. Insert new tier at order 1
      insertTier.run({
        destinationId: dest.id,
        category: cat,
        tierName: split.newName,
        tierOrder: 1,
        pricingType,
        priceLowPeak: split.newPriceLowPeak,
        priceHighPeak: split.newPriceHighPeak,
        priceLowOffPeak: split.newPriceLowOffPeak,
        priceHighOffPeak: split.newPriceHighOffPeak,
        blurb: split.newBlurb,
      });
      totalInserted++;

      // 3. Update old tier 1 (now at order 2) with tighter range + revised blurb
      updateTierByOrder.run({
        destinationId: dest.id,
        category: cat,
        tierOrder: 2,
        tierName: split.revisedName,
        priceLowPeak: split.revisedPriceLowPeak,
        priceHighPeak: split.revisedPriceHighPeak,
        priceLowOffPeak: split.revisedPriceLowOffPeak,
        priceHighOffPeak: split.revisedPriceHighOffPeak,
        blurb: split.revisedBlurb,
      });
    }

    console.log(`  ✓ ${slug}`);
  }
});

run();

const totalTiers = (db.prepare("SELECT COUNT(*) as cnt FROM Tier").get() as { cnt: number }).cnt;
console.log(`\n✅ Done. Inserted ${totalInserted} new top tiers. Total tiers: ${totalTiers}`);
db.close();
