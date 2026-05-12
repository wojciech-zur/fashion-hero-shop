import { NextRequest, NextResponse } from "next/server";
import {
  activateSellerBoost,
  applyBoostSelection,
  debugDeactivateSellerBoost,
  debugExpireSellerBoost,
  debugRestoreSellerBoost,
  getSellerBoostStatus,
  isProductPromoted,
} from "@/lib/new-seller-boost-store";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const sellerId = req.nextUrl.searchParams.get("sellerId");
  const productId = req.nextUrl.searchParams.get("productId");

  if (productId) {
    const promoted = await isProductPromoted(productId);
    return NextResponse.json({ promoted });
  }

  if (!sellerId) {
    return badRequest("sellerId is required");
  }

  try {
    const status = await getSellerBoostStatus(sellerId);
    return NextResponse.json(status);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to load boost status");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sellerId?: string };
    if (!body.sellerId) {
      return badRequest("sellerId is required");
    }

    const status = await activateSellerBoost(body.sellerId);
    return NextResponse.json(status);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to activate boost");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { sellerId?: string; boostedProductIds?: string[] };
    if (!body.sellerId) {
      return badRequest("sellerId is required");
    }
    if (!Array.isArray(body.boostedProductIds)) {
      return badRequest("boostedProductIds must be an array");
    }

    const status = await applyBoostSelection(body.sellerId, body.boostedProductIds);
    return NextResponse.json(status);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to apply boost changes");
  }
}

export async function DELETE(req: NextRequest) {
  const sellerId = req.nextUrl.searchParams.get("sellerId");
  if (!sellerId) {
    return badRequest("sellerId is required");
  }

  try {
    const status = await debugDeactivateSellerBoost(sellerId);
    return NextResponse.json(status);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to deactivate boost");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { sellerId?: string; action?: "expire" | "restore" };
    if (!body.sellerId) {
      return badRequest("sellerId is required");
    }
    if (!body.action) {
      return badRequest("action is required");
    }

    if (body.action === "expire") {
      const status = await debugExpireSellerBoost(body.sellerId);
      return NextResponse.json(status);
    }

    if (body.action === "restore") {
      const status = await debugRestoreSellerBoost(body.sellerId);
      return NextResponse.json(status);
    }

    return badRequest("Unsupported action");
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to perform debug action");
  }
}
