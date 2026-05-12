import { NextRequest, NextResponse } from "next/server";
import { getPromotedProductsForCollection } from "@/lib/new-seller-boost-store";

export async function GET(req: NextRequest) {
  const collectionSlug = req.nextUrl.searchParams.get("collectionSlug");
  if (!collectionSlug) {
    return NextResponse.json({ error: "collectionSlug is required" }, { status: 400 });
  }

  const products = await getPromotedProductsForCollection(collectionSlug);
  return NextResponse.json({ products });
}
