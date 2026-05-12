"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getSellerById } from "@/data/sellers";
import { getProductsBySellerId } from "@/data/products";
import type { NewSellerBoostStatus } from "@/types/new-seller-boost";
import { captureEvent } from "@/lib/posthog-client";

interface SellerBoostStats {
  promoViews: number;
  promoClicks: number;
  promoSold: number;
  configured?: boolean;
  trackingConfigured?: boolean;
  reason?: string;
}

const DEFAULT_STATS: SellerBoostStats = {
  promoViews: 0,
  promoClicks: 0,
  promoSold: 0,
  configured: true,
};

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<NewSellerBoostStatus | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [appliedProductIds, setAppliedProductIds] = useState<string[]>([]);
  const [stats, setStats] = useState<SellerBoostStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [error, setError] = useState("");
  const bannerViewTrackedRef = useRef<string | null>(null);
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  const seller = useMemo(() => {
    if (!user?.sellerId) return null;
    return getSellerById(user.sellerId) ?? null;
  }, [user?.sellerId]);

  const sellerProducts = useMemo(() => {
    if (!seller) return [];
    return getProductsBySellerId(seller.id);
  }, [seller]);
  const showBoostOfferCard = Boolean(status?.active || (status?.eligible && !status?.usedOnce));
  const showExpiredRestoreDebug = Boolean(!status?.active && status?.usedOnce);

  useEffect(() => {
    if (!user) {
      router.push("/account/login");
      return;
    }

    if (!user.sellerId) {
      router.push("/account");
      return;
    }
  }, [router, user]);

  useEffect(() => {
    async function loadStatus() {
      if (!user?.sellerId) return;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/new-seller-boost?sellerId=${user.sellerId}`);
        const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
        if (!response.ok || "error" in payload) {
          throw new Error("error" in payload ? payload.error : "Failed to load seller boost status");
        }
        setStatus(payload);
        setSelectedProductIds(payload.boostedProductIds);
        setAppliedProductIds(payload.boostedProductIds);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load seller boost status.");
      } finally {
        setLoading(false);
      }
    }

    void loadStatus();
  }, [user?.sellerId]);

  useEffect(() => {
    async function loadStats() {
      if (!user?.sellerId || !status?.active) {
        setStats(DEFAULT_STATS);
        return;
      }

      try {
        const response = await fetch(`/api/new-seller-boost/stats?sellerId=${user.sellerId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as SellerBoostStats | { error: string };
        if (!response.ok || "error" in payload) {
          throw new Error("error" in payload ? payload.error : "Failed to load stats");
        }
        setStats({
          ...DEFAULT_STATS,
          ...payload,
          promoViews: Number(payload.promoViews ?? 0),
          promoClicks: Number(payload.promoClicks ?? 0),
          promoSold: Number(payload.promoSold ?? 0),
        });
      } catch {
        setStats(DEFAULT_STATS);
      }
    }

    void loadStats();
  }, [status?.active, user?.sellerId]);

  useEffect(() => {
    if (!user?.sellerId || !status) return;

    const shouldTrackBannerView = status.eligible && !status.active && !status.usedOnce;
    if (!shouldTrackBannerView) {
      bannerViewTrackedRef.current = null;
      return;
    }

    const traceKey = `${user.sellerId}:${status.active}:${status.usedOnce}`;
    if (bannerViewTrackedRef.current === traceKey) {
      return;
    }

    captureEvent("boost_banner_view", {
      sellerId: user.sellerId,
      eligible: status.eligible,
      active: status.active,
      usedOnce: status.usedOnce,
    });

    bannerViewTrackedRef.current = traceKey;
  }, [status, user?.sellerId]);

  async function activateBoost() {
    if (!user?.sellerId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/new-seller-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user.sellerId }),
      });
      const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to activate boost");
      }
      setStatus(payload);
      setSelectedProductIds(payload.boostedProductIds);
      setAppliedProductIds(payload.boostedProductIds);
      captureEvent("boost_activate", {
        sellerId: payload.sellerId,
        activatedAt: payload.activatedAt,
      });
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : "Activation failed.");
    } finally {
      setSaving(false);
    }
  }

  async function applyChanges() {
    if (!user?.sellerId || !status?.active) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/new-seller-boost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: user.sellerId,
          boostedProductIds: selectedProductIds,
        }),
      });
      const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to apply changes");
      }
      setStatus(payload);
      setSelectedProductIds(payload.boostedProductIds);
      setAppliedProductIds(payload.boostedProductIds);
      setSaveToast(`Changes saved - ${payload.boostedProductIds.length} offers boosted`);
      captureEvent("boost_apply_changes", {
        sellerId: payload.sellerId,
        selectedOffers: payload.boostedProductIds.length,
      });
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Could not apply changes.");
    } finally {
      setSaving(false);
    }
  }

  async function debugDeactivate() {
    if (!user?.sellerId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/new-seller-boost?sellerId=${user.sellerId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to deactivate boost");
      }
      setStatus(payload);
      setSelectedProductIds([]);
      setAppliedProductIds([]);
      setSaveToast("DEBUG: boost deactivated");
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : "Could not deactivate boost.");
    } finally {
      setSaving(false);
    }
  }

  async function debugExpire() {
    if (!user?.sellerId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/new-seller-boost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user.sellerId, action: "expire" }),
      });
      const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to expire boost");
      }
      setStatus(payload);
      setSelectedProductIds([]);
      setAppliedProductIds([]);
      setSaveToast("DEBUG: boost expired");
    } catch (expireError) {
      setError(expireError instanceof Error ? expireError.message : "Could not expire boost.");
    } finally {
      setSaving(false);
    }
  }

  async function debugRestore() {
    if (!user?.sellerId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/new-seller-boost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user.sellerId, action: "restore" }),
      });
      const payload = (await response.json()) as NewSellerBoostStatus | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to restore boost");
      }
      setStatus(payload);
      setSelectedProductIds([]);
      setAppliedProductIds([]);
      setSaveToast("DEBUG: boost restored");
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Could not restore boost.");
    } finally {
      setSaving(false);
    }
  }

  function startPriceEdit(productId: string, currentPrice: number) {
    setEditingPriceProductId(productId);
    setEditingPriceValue(String(currentPrice));
  }

  function cancelPriceEdit() {
    setEditingPriceProductId(null);
    setEditingPriceValue("");
  }

  function savePrice(productId: string) {
    const parsed = Number(editingPriceValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    setPriceOverrides((prev) => ({ ...prev, [productId]: Math.round(parsed) }));
    setSaveToast("Price updated (local preview)");
    cancelPriceEdit();
  }

  function toggleProduct(productId: string) {
    if (!status?.active) return;

    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= status.maxBoostedOffers) {
        setError(`You can promote up to ${status.maxBoostedOffers} offers.`);
        return current;
      }
      setError("");
      return [...current, productId];
    });
  }

  useEffect(() => {
    if (!saveToast) return;
    const timeout = window.setTimeout(() => setSaveToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [saveToast]);

  const hasPendingChanges = useMemo(() => {
    if (!status?.active) return false;
    if (selectedProductIds.length !== appliedProductIds.length) return true;
    const selected = new Set(selectedProductIds);
    return appliedProductIds.some((id) => !selected.has(id));
  }, [appliedProductIds, selectedProductIds, status?.active]);

  if (!user || !seller) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      {saveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-charcoal text-white px-5 py-2 text-sm shadow-lg">
          {saveToast}
        </div>
      )}

      <nav className="text-[11px] text-warm-gray mb-8 tracking-wide">
        <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-charcoal">Seller Dashboard</span>
      </nav>

      <p className="text-[11px] uppercase tracking-[1px] text-warm-gray mb-3">New Seller Boost</p>
      <h1 className="text-4xl font-light text-charcoal mb-2">Welcome, {seller.name}</h1>
      <p className="text-sm text-warm-gray mb-8">
        Manage your listings and promotion settings.
      </p>

      {loading ? (
        <p className="text-sm text-warm-gray">Loading seller boost status...</p>
      ) : (
        <>
          {showBoostOfferCard && (
            <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-charcoal to-charcoal-light text-white p-6 md:p-8 mb-8 shadow-sm">
              <p className="text-[11px] uppercase tracking-[1px] text-white/70 mb-2">New Seller Boost</p>
              <h2 className="text-3xl font-light mb-3">Get premium placement at the top of category pages</h2>
              <div className="text-sm text-white/90 max-w-2xl mb-6 space-y-1.5">
                <p>Put your best products in front of high-intent shoppers for 7 days.</p>
                <p>Select up to 10 listings and get extra visibility where purchase decisions happen.</p>
                <p className="text-white/75">
                  Available only for new sellers (up to 20 offers at activation). One-time activation per account.
                </p>
              </div>

              {!status?.active && !status?.usedOnce && (
                <button
                  onClick={activateBoost}
                  disabled={saving}
                  className="btn-cta !bg-white !text-charcoal border border-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.15)] hover:opacity-100 hover:brightness-95 disabled:opacity-60"
                >
                  Activate New Seller Boost for 49 zl
                </button>
              )}

              {status?.active && (
                <div className="text-sm text-white/90 space-y-1">
                  <p>Active until: {status.expiresAt ? new Date(status.expiresAt).toLocaleString() : "-"}</p>
                  <p>Boosted listings: {selectedProductIds.length}/{status.maxBoostedOffers}</p>
                </div>
              )}

              {!status?.active && status?.usedOnce && (
                <p className="text-sm text-white/90">
                  New Seller Boost has already been used and completed.
                </p>
              )}

              <p className="text-[11px] text-white/60 mt-4">
                49 zl will be added to your FashionHero invoice.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                {status?.active && (
                  <>
                    <button
                      onClick={debugExpire}
                      disabled={saving}
                      className="text-[10px] uppercase tracking-[0.8px] px-2.5 py-1 rounded-full border border-white/35 text-white/80 hover:text-white hover:border-white/60 transition-colors disabled:opacity-60"
                    >
                      DEBUG: expire
                    </button>
                    <button
                      onClick={debugDeactivate}
                      disabled={saving}
                      className="text-[10px] uppercase tracking-[0.8px] px-2.5 py-1 rounded-full border border-white/35 text-white/80 hover:text-white hover:border-white/60 transition-colors disabled:opacity-60"
                    >
                      DEBUG: deactivate
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {showExpiredRestoreDebug && (
            <div className="mb-8 flex justify-end">
              <button
                onClick={debugRestore}
                disabled={saving}
                className="text-[10px] uppercase tracking-[0.8px] px-3 py-1.5 rounded-full border border-black/25 text-charcoal/80 hover:text-charcoal hover:border-charcoal transition-colors disabled:opacity-60"
              >
                DEBUG: RESTORE EXPIRED NEW SELLER BOOST
              </button>
            </div>
          )}

          {!!error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          {status?.active && (
            <section className="mb-8 border border-black/10 rounded-xl p-5 bg-white">
              <h3 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal mb-4">
                Boost stats
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray">Promo views</p>
                  <p className="text-2xl text-charcoal mt-1">{stats.promoViews}</p>
                </div>
                <div className="rounded-lg border border-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray">Promo clicks</p>
                  <p className="text-2xl text-charcoal mt-1">{stats.promoClicks}</p>
                </div>
                <div className="rounded-lg border border-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray">Promo sold</p>
                  <p className="text-2xl text-charcoal mt-1">{stats.promoSold}</p>
                </div>
              </div>
              {stats.configured === false && (
                <p className="text-[12px] text-warm-gray mt-4">
                  DEBUG: {stats.reason ?? "PostHog stats are not configured yet."}
                </p>
              )}
            </section>
          )}

          <section className="border border-black/10 rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal">
                Seller offers
              </h2>
              <p className="text-xs text-warm-gray">{sellerProducts.length} total offers</p>
            </div>

            <div className="space-y-2">
              {sellerProducts.map((product) => {
                const selected = selectedProductIds.includes(product.id);
                const applied = appliedProductIds.includes(product.id);
                const isEditingPrice = editingPriceProductId === product.id;
                const shownPrice = priceOverrides[product.id] ?? product.price;
                return (
                  <div
                    key={product.id}
                    className="border border-black/10 rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-14 overflow-hidden rounded-md bg-cream-light border border-black/10">
                        <Image
                          src={product.colors[0]?.image ?? product.images[0]}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-charcoal truncate">{product.name}</p>
                        {isEditingPrice ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              className="w-24 border border-black/20 rounded px-2 py-1 text-xs text-charcoal bg-white outline-none focus:border-charcoal"
                              aria-label={`Edit price for ${product.name}`}
                            />
                            <span className="text-xs text-warm-gray">zl</span>
                          </div>
                        ) : (
                          <p className="text-xs text-warm-gray">
                            {shownPrice} zl
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditingPrice ? (
                        <>
                          <button
                            onClick={() => savePrice(product.id)}
                            className="text-[11px] uppercase tracking-[0.8px] px-3 py-1.5 rounded-full border border-charcoal bg-charcoal text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelPriceEdit}
                            className="text-[11px] uppercase tracking-[0.8px] px-3 py-1.5 rounded-full border border-black/20 text-charcoal hover:border-charcoal transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startPriceEdit(product.id, shownPrice)}
                          className="text-[11px] uppercase tracking-[0.8px] px-3 py-1.5 rounded-full border border-black/20 text-charcoal hover:border-charcoal transition-colors"
                        >
                          Edit price
                        </button>
                      )}
                      {status?.active && (
                        <button
                          onClick={() => toggleProduct(product.id)}
                          className={`text-[11px] uppercase tracking-[0.8px] px-3 py-1.5 rounded-full border transition-colors ${
                            selected
                              ? "bg-charcoal text-white border-charcoal"
                              : "bg-white text-charcoal border-black/20 hover:border-charcoal"
                          }`}
                        >
                          {selected
                            ? applied
                              ? "UNBOOST IT..."
                              : "SELECTED TO BOOST !"
                            : applied
                              ? "CHOOSED TO UNBOOST..."
                              : "BOOST IT !"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {status?.active && (
              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-sm text-warm-gray">
                  {selectedProductIds.length}/{status.maxBoostedOffers} selected
                  {hasPendingChanges ? " · pending changes" : ""}
                </p>
                <button onClick={applyChanges} disabled={saving || !hasPendingChanges} className="btn-cta">
                  Apply changes
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
