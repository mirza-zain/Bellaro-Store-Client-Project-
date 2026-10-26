export type SectionInfo = {
  section: "kids" | "adults" | "perfumes" | "general";
  label: string;
  shortLabel: string;
  badgeClass: string;
};

export function getItemSectionInfo(item: {
  name?: string;
  category?: string;
  variant?: string;
}): SectionInfo {
  const variantStr = String(item?.variant || "").toLowerCase();
  const nameStr = String(item?.name || "").toLowerCase();
  const catStr = String(item?.category || "").toLowerCase();

  // 1. Explicit keyword checks
  if (
    variantStr.includes("kid") ||
    nameStr.includes("kid") ||
    catStr.includes("kid") ||
    variantStr.includes("child") ||
    nameStr.includes("child")
  ) {
    return {
      section: "kids",
      label: "🧒 Kids Section",
      shortLabel: "🧒 Kids",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }

  // 2. Check perfume indicators
  if (
    variantStr.includes("ml") ||
    catStr.includes("perfume") ||
    catStr.includes("parfum") ||
    nameStr.includes("eau de") ||
    nameStr.includes("parfum") ||
    nameStr.includes("extrait") ||
    nameStr.includes("attar")
  ) {
    return {
      section: "perfumes",
      label: "🌸 Perfumes",
      shortLabel: "🌸 Perfume",
      badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    };
  }

  // 3. Numeric footwear size check (kids: 28-38, adults: 39-48)
  const numMatch = variantStr.match(/\b(2[8-9]|3[0-8])\b/);
  const adultNumMatch = variantStr.match(/\b(39|4[0-8])\b/);

  if (numMatch) {
    return {
      section: "kids",
      label: "🧒 Kids Section",
      shortLabel: "🧒 Kids",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }

  if (adultNumMatch || variantStr.includes("adult")) {
    return {
      section: "adults",
      label: "👞 Adults Section",
      shortLabel: "👞 Adults",
      badgeClass: "bg-sky-100 text-sky-900 border-sky-200",
    };
  }

  // 4. Category fallback
  if (
    catStr.includes("footwear") ||
    nameStr.includes("shoe") ||
    nameStr.includes("loafer") ||
    nameStr.includes("moccasin") ||
    nameStr.includes("slide")
  ) {
    return {
      section: "adults",
      label: "👞 Footwear",
      shortLabel: "👞 Footwear",
      badgeClass: "bg-neutral-100 text-neutral-800 border-neutral-200",
    };
  }

  return {
    section: "general",
    label: item?.category || "General",
    shortLabel: item?.category || "General",
    badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
}

export function getOrderAudienceBadges(items?: any[]): {
  hasKids: boolean;
  hasAdults: boolean;
  hasPerfumes: boolean;
  badges: SectionInfo[];
} {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { hasKids: false, hasAdults: false, hasPerfumes: false, badges: [] };
  }

  let hasKids = false;
  let hasAdults = false;
  let hasPerfumes = false;

  for (const it of items) {
    const sec = getItemSectionInfo(it);
    if (sec.section === "kids") hasKids = true;
    if (sec.section === "adults") hasAdults = true;
    if (sec.section === "perfumes") hasPerfumes = true;
  }

  const badges: SectionInfo[] = [];
  if (hasKids) {
    badges.push({
      section: "kids",
      label: "🧒 Kids Order",
      shortLabel: "🧒 Kids",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    });
  }
  if (hasAdults) {
    badges.push({
      section: "adults",
      label: "👞 Adults Order",
      shortLabel: "👞 Adults",
      badgeClass: "bg-sky-100 text-sky-900 border-sky-200 font-bold",
    });
  }
  if (hasPerfumes) {
    badges.push({
      section: "perfumes",
      label: "🌸 Perfume Order",
      shortLabel: "🌸 Perfume",
      badgeClass: "bg-purple-100 text-purple-900 border-purple-200 font-bold",
    });
  }

  return { hasKids, hasAdults, hasPerfumes, badges };
}
