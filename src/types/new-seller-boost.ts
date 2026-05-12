export interface NewSellerBoostState {
  sellerId: string;
  usedOnce: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  boostedProductIds: string[];
}

export interface NewSellerBoostStoreData {
  sellers: Record<string, NewSellerBoostState>;
}

export interface NewSellerBoostStatus {
  sellerId: string;
  eligible: boolean;
  active: boolean;
  usedOnce: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  boostedProductIds: string[];
  maxBoostedOffers: number;
}
