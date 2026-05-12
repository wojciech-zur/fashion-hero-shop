const ATTRIBUTION_KEY = "fh_new_seller_boost_attribution";

interface PromoAttributionEntry {
  productId: string;
  sellerId: string;
  source: "new_seller_boost";
  clickedAt: string;
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readEntries(): PromoAttributionEntry[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PromoAttributionEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: PromoAttributionEntry[]) {
  if (!isClient()) return;
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(entries));
}

export function markPromoAttribution(productId: string, sellerId: string) {
  const existing = readEntries().filter((entry) => entry.productId !== productId);
  existing.push({
    productId,
    sellerId,
    source: "new_seller_boost",
    clickedAt: new Date().toISOString(),
  });
  writeEntries(existing);
}

export function getPromoAttribution(productId: string): PromoAttributionEntry | null {
  return readEntries().find((entry) => entry.productId === productId) ?? null;
}
