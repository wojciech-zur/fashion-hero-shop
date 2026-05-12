import { promises as fs } from "node:fs";
import path from "node:path";
import { products, getProductsByCollection } from "@/data/products";
import { getSellerById, sellers } from "@/data/sellers";
import type {
  NewSellerBoostState,
  NewSellerBoostStatus,
  NewSellerBoostStoreData,
} from "@/types/new-seller-boost";

const BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BOOSTED_OFFERS = 10;
const ELIGIBLE_MAX_OFFERS = 20;
const SOURCE_DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "new-seller-boost.json");
const DATA_FILE_PATH =
  process.env.NEW_SELLER_BOOST_STORE_PATH?.trim() ||
  (process.env.VERCEL
    ? path.join("/tmp", "new-seller-boost.json")
    : SOURCE_DATA_FILE_PATH);

let writeQueue: Promise<void> = Promise.resolve();

const emptyStore: NewSellerBoostStoreData = { sellers: {} };

function createDefaultState(sellerId: string): NewSellerBoostState {
  return {
    sellerId,
    usedOnce: false,
    activatedAt: null,
    expiresAt: null,
    boostedProductIds: [],
  };
}

async function ensureStoreFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    let initialStore = emptyStore;

    if (DATA_FILE_PATH !== SOURCE_DATA_FILE_PATH) {
      try {
        const sourceRaw = await fs.readFile(SOURCE_DATA_FILE_PATH, "utf8");
        const sourceParsed = JSON.parse(sourceRaw) as NewSellerBoostStoreData;
        if (sourceParsed?.sellers) {
          initialStore = sourceParsed;
        }
      } catch {
        initialStore = emptyStore;
      }
    }

    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<NewSellerBoostStoreData> {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as NewSellerBoostStoreData;
    return parsed?.sellers ? parsed : emptyStore;
  } catch {
    return emptyStore;
  }
}

async function writeStore(data: NewSellerBoostStoreData): Promise<void> {
  await ensureStoreFile();
  writeQueue = writeQueue.then(async () => {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  });
  await writeQueue;
}

function isEligibleSeller(sellerId: string): boolean {
  if (!getSellerById(sellerId)) return false;
  const sellerOfferCount = products.filter((product) => product.sellerId === sellerId).length;
  return sellerOfferCount <= ELIGIBLE_MAX_OFFERS;
}

function isStateActive(state: NewSellerBoostState): boolean {
  if (!state.activatedAt || !state.expiresAt) {
    return false;
  }
  return Date.now() <= new Date(state.expiresAt).getTime();
}

function expireStateIfNeeded(state: NewSellerBoostState): { state: NewSellerBoostState; changed: boolean } {
  if (!state.expiresAt || Date.now() <= new Date(state.expiresAt).getTime()) {
    return { state, changed: false };
  }

  return {
    state: {
      ...state,
      activatedAt: null,
      expiresAt: null,
      boostedProductIds: [],
    },
    changed: true,
  };
}

function getSellerProductIdSet(sellerId: string): Set<string> {
  const ids = products.filter((product) => product.sellerId === sellerId).map((product) => product.id);
  return new Set(ids);
}

function toStatus(state: NewSellerBoostState): NewSellerBoostStatus {
  return {
    sellerId: state.sellerId,
    eligible: isEligibleSeller(state.sellerId),
    active: isStateActive(state),
    usedOnce: state.usedOnce,
    activatedAt: state.activatedAt,
    expiresAt: state.expiresAt,
    boostedProductIds: state.boostedProductIds,
    maxBoostedOffers: MAX_BOOSTED_OFFERS,
  };
}

async function withSellerState(
  sellerId: string,
  updater?: (state: NewSellerBoostState) => NewSellerBoostState
): Promise<NewSellerBoostState> {
  const data = await readStore();
  const current = data.sellers[sellerId] ?? createDefaultState(sellerId);
  const expired = expireStateIfNeeded(current);
  let next = expired.state;

  if (updater) {
    next = updater(next);
  }

  const changed =
    expired.changed ||
    JSON.stringify(next) !== JSON.stringify(data.sellers[sellerId] ?? createDefaultState(sellerId));

  if (changed) {
    data.sellers[sellerId] = next;
    await writeStore(data);
  }

  return next;
}

export async function getSellerBoostStatus(sellerId: string): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  const state = await withSellerState(sellerId);
  return toStatus(state);
}

export async function activateSellerBoost(sellerId: string): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  if (!isEligibleSeller(sellerId)) {
    throw new Error("Seller is not eligible for New Seller Boost");
  }

  const activatedState = await withSellerState(sellerId, (state) => {
    if (state.usedOnce) {
      throw new Error("New Seller Boost can only be activated once");
    }

    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt.getTime() + BOOST_DURATION_MS);

    return {
      ...state,
      usedOnce: true,
      activatedAt: activatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      boostedProductIds: [],
    };
  });

  return toStatus(activatedState);
}

export async function applyBoostSelection(
  sellerId: string,
  boostedProductIds: string[]
): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  const productIds = Array.from(new Set(boostedProductIds));
  if (productIds.length > MAX_BOOSTED_OFFERS) {
    throw new Error(`You can promote up to ${MAX_BOOSTED_OFFERS} offers`);
  }

  const sellerProductIds = getSellerProductIdSet(sellerId);
  const invalidSelection = productIds.some((id) => !sellerProductIds.has(id));
  if (invalidSelection) {
    throw new Error("Selection contains offers that do not belong to this seller");
  }

  const nextState = await withSellerState(sellerId, (state) => {
    if (!isStateActive(state)) {
      throw new Error("Boost is not active");
    }
    return {
      ...state,
      boostedProductIds: productIds,
    };
  });

  return toStatus(nextState);
}

export async function getPromotedProductsForCollection(collectionSlug: string) {
  const data = await readStore();
  let changed = false;
  const collectionProductIds = new Set(getProductsByCollection(collectionSlug).map((product) => product.id));

  const promotedProducts = [];
  for (const seller of sellers) {
    const state = data.sellers[seller.id] ?? createDefaultState(seller.id);
    const expired = expireStateIfNeeded(state);
    const active = isStateActive(expired.state);

    if (expired.changed) {
      changed = true;
      data.sellers[seller.id] = expired.state;
    }

    if (!active || expired.state.boostedProductIds.length === 0) {
      continue;
    }

    for (const productId of expired.state.boostedProductIds) {
      if (!collectionProductIds.has(productId)) continue;
      const product = products.find((item) => item.id === productId);
      if (!product) continue;
      promotedProducts.push({
        ...product,
        boostSellerId: seller.id,
      });
    }
  }

  if (changed) {
    await writeStore(data);
  }

  return promotedProducts;
}

export async function isProductPromoted(productId: string): Promise<boolean> {
  const data = await readStore();
  let changed = false;
  let promoted = false;

  for (const seller of sellers) {
    const state = data.sellers[seller.id] ?? createDefaultState(seller.id);
    const expired = expireStateIfNeeded(state);
    if (expired.changed) {
      changed = true;
      data.sellers[seller.id] = expired.state;
    }

    if (!isStateActive(expired.state)) {
      continue;
    }

    if (expired.state.boostedProductIds.includes(productId)) {
      promoted = true;
      break;
    }
  }

  if (changed) {
    await writeStore(data);
  }

  return promoted;
}

export async function debugDeactivateSellerBoost(sellerId: string): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  const nextState = await withSellerState(sellerId, (state) => ({
    ...state,
    usedOnce: false,
    activatedAt: null,
    expiresAt: null,
    boostedProductIds: [],
  }));

  return toStatus(nextState);
}

export async function debugExpireSellerBoost(sellerId: string): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  const now = new Date();
  const expiredAt = new Date(now.getTime() - 60 * 1000).toISOString();

  const nextState = await withSellerState(sellerId, (state) => {
    if (!isStateActive(state)) {
      throw new Error("Boost is not active");
    }

    return {
      ...state,
      usedOnce: true,
      activatedAt: state.activatedAt ?? now.toISOString(),
      expiresAt: expiredAt,
      boostedProductIds: [],
    };
  });

  return toStatus(nextState);
}

export async function debugRestoreSellerBoost(sellerId: string): Promise<NewSellerBoostStatus> {
  if (!getSellerById(sellerId)) {
    throw new Error("Seller not found");
  }

  const nextState = await withSellerState(sellerId, (state) => ({
    ...state,
    usedOnce: false,
    activatedAt: null,
    expiresAt: null,
    boostedProductIds: [],
  }));

  return toStatus(nextState);
}
