import { NextRequest, NextResponse } from "next/server";

interface PostHogCountResponse {
  results?: Array<Array<number>>;
}

function normalizeProjectId(rawProjectId: string | undefined): string | null {
  if (!rawProjectId) return null;
  const digits = rawProjectId.replace(/[^\d]/g, "");
  return digits || rawProjectId;
}

function normalizePostHogApiHost(rawHost: string | undefined): string {
  const host = rawHost || "https://eu.posthog.com";
  // Common mistake: ingest host used for query API.
  return host
    .replace("://eu.i.posthog.com", "://eu.posthog.com")
    .replace("://us.i.posthog.com", "://us.posthog.com");
}

function hasPostHogCredentials(): boolean {
  return Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY &&
    process.env.POSTHOG_PROJECT_ID
  );
}

function hasPostHogTrackingConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  );
}

async function queryPostHogNumber(query: string): Promise<number> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = normalizeProjectId(process.env.POSTHOG_PROJECT_ID);
  const host = normalizePostHogApiHost(process.env.POSTHOG_HOST);

  if (!apiKey || !projectId) {
    return 0;
  }

  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return 0;
  }

  const payload = (await response.json()) as PostHogCountResponse;
  const value = payload.results?.[0]?.[0];
  return typeof value === "number" ? value : 0;
}

export async function GET(req: NextRequest) {
  const sellerId = req.nextUrl.searchParams.get("sellerId");
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId is required" }, { status: 400 });
  }

  if (!hasPostHogCredentials()) {
    return NextResponse.json({
      promoViews: 0,
      promoClicks: 0,
      promoSold: 0,
      configured: false,
      trackingConfigured: hasPostHogTrackingConfig(),
      reason: "Stats require POSTHOG_PERSONAL_API_KEY for query access.",
    });
  }

  const escapedSellerId = sellerId.replace(/'/g, "''");

  const promoViews = await queryPostHogNumber(
    `SELECT count() FROM events WHERE event = 'promo_carousel_view' AND toString(properties.sellerId) = '${escapedSellerId}'`
  );

  const promoClicks = await queryPostHogNumber(
    `SELECT count() FROM events WHERE event = 'promo_carousel_click' AND toString(properties.sellerId) = '${escapedSellerId}'`
  );

  const promoSold = await queryPostHogNumber(
    `SELECT coalesce(sum(toInt(properties.quantity)), 0) FROM events WHERE event = 'promo_place_order' AND toString(properties.sellerId) = '${escapedSellerId}'`
  );

  return NextResponse.json({ promoViews, promoClicks, promoSold, configured: true, trackingConfigured: true });
}
