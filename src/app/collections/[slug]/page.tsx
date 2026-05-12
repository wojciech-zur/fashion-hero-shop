import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollection } from "@/data/collections";
import { collections } from "@/data/collections";
import { getProductsByCollection } from "@/data/products";
import { CollectionHero } from "@/components/collection-hero";
import { CollectionView } from "@/components/collection-view";
import { getPromotedProductsForCollection } from "@/lib/new-seller-boost-store";
import { NewSellerBoostCarousel } from "@/components/sections/new-seller-boost-carousel";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ seller?: string }>;
}

export async function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${collection.name} | FashionHero`,
    description: collection.description,
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { seller } = await searchParams;
  const collection = getCollection(slug);

  if (!collection) {
    notFound();
  }

  const products = getProductsByCollection(slug);
  const promotedProducts = await getPromotedProductsForCollection(slug);

  return (
    <>
      <CollectionHero collection={collection} />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        <NewSellerBoostCarousel products={promotedProducts} />
      </div>
      <CollectionView
        products={products}
        collectionName={collection.name}
        initialSellerSlug={seller}
      />
    </>
  );
}
