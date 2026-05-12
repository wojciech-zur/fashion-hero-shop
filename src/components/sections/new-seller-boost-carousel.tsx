"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product-card";
import { markPromoAttribution } from "@/lib/promo-attribution";
import { captureEvent } from "@/lib/posthog-client";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface BoostedProduct extends Product {
  boostSellerId: string;
}

interface NewSellerBoostCarouselProps {
  products: BoostedProduct[];
}

function shuffleProducts<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function NewSellerBoostCarousel({ products }: NewSellerBoostCarouselProps) {
  const shuffledProducts = useMemo(() => shuffleProducts(products), [products]);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const trackedImpressionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const product of shuffledProducts) {
      const impressionKey = `${product.boostSellerId}:${product.id}`;
      if (trackedImpressionsRef.current.has(impressionKey)) {
        continue;
      }
      trackedImpressionsRef.current.add(impressionKey);
      captureEvent("promo_carousel_view", {
        sellerId: product.boostSellerId,
        productId: product.id,
        collectionSlug: product.collections[0] ?? "unknown",
        isPromoted: true,
      });
    }
  }, [shuffledProducts]);

  if (shuffledProducts.length === 0) {
    return null;
  }

  function scrollByCards(direction: "left" | "right") {
    const element = carouselRef.current;
    if (!element) return;
    const cardWidth = 280;
    const delta = direction === "left" ? -cardWidth : cardWidth;
    element.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray">
            New Seller Boost
          </p>
          <h2 className="text-2xl font-light text-charcoal">
            Just dropped: standout picks from new sellers
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scrollByCards("left")}
            className="h-9 w-9 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-charcoal transition-colors"
            aria-label="Scroll featured offers left"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollByCards("right")}
            className="h-9 w-9 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-charcoal transition-colors"
            aria-label="Scroll featured offers right"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {shuffledProducts.map((product) => (
          <div key={product.id} className="min-w-[260px] max-w-[260px]">
            <ProductCard
              product={product}
              onProductClick={(clickedProduct) => {
                markPromoAttribution(clickedProduct.id, product.boostSellerId);
                captureEvent("promo_carousel_click", {
                  sellerId: product.boostSellerId,
                  productId: clickedProduct.id,
                  collectionSlug: clickedProduct.collections[0] ?? "unknown",
                  isPromoted: true,
                });
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
