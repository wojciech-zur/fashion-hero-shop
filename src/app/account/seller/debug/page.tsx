"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { sellers } from "@/data/sellers";
import { products } from "@/data/products";

const sellerOfferCounts = products.reduce<Record<string, number>>((acc, product) => {
  acc[product.sellerId] = (acc[product.sellerId] ?? 0) + 1;
  return acc;
}, {});

export default function SellerDebugPickerPage() {
  const { user, setSellerContext } = useAuth();
  const router = useRouter();
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [error, setError] = useState("");

  const orderedSellers = useMemo(
    () => [...sellers].sort((a, b) => (sellerOfferCounts[a.id] ?? 0) - (sellerOfferCounts[b.id] ?? 0)),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user) {
      router.push("/account/login");
      return;
    }

    if (!selectedSellerId) {
      setError("Select a seller to continue.");
      return;
    }

    setSellerContext(selectedSellerId);
    router.push("/account/seller");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <nav className="text-[11px] text-warm-gray mb-8 tracking-wide">
        <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/account" className="hover:text-charcoal transition-colors">Account</Link>
        <span className="mx-1.5">/</span>
        <span className="text-charcoal">Seller Debug</span>
      </nav>

      <p className="text-[11px] uppercase tracking-[1px] text-warm-gray mb-3">DEBUG: Seller Dashboard</p>
      <h1 className="text-2xl font-light text-charcoal mb-3">Choose seller profile</h1>
      <p className="text-[13px] text-warm-gray mb-8">
        This debug screen sets your seller context before opening the seller dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-600 text-[13px]">{error}</p>}
        <div>
          <label htmlFor="sellerId" className="block text-[11px] font-medium uppercase tracking-[0.8px] text-charcoal mb-1.5">
            Seller account
          </label>
          <select
            id="sellerId"
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="w-full border border-black/15 rounded px-3 py-2.5 text-[14px] text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
          >
            <option value="">Choose seller</option>
            {orderedSellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name} ({sellerOfferCounts[seller.id] ?? 0} offers)
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-cta w-full text-[12px]">
          Open seller dashboard
        </button>
      </form>
    </div>
  );
}
