import type { Seller } from "@/types";

export const sellers: Seller[] = [
  {
    id: "s1",
    name: "UrbanEdge",
    slug: "urban-edge",
    description: "Streetwear essentials for the modern city. Bold designs, premium quality.",
    logo: "/images/sellers/urban-edge.svg",
    joinedYear: 2021,
    rating: 4.6,
  },
  {
    id: "s2",
    name: "Bella Donna",
    slug: "bella-donna",
    description: "Elegant women's fashion crafted with attention to every detail.",
    logo: "/images/sellers/bella-donna.svg",
    joinedYear: 2021,
    rating: 4.7,
  },
  {
    id: "s3",
    name: "SportPeak",
    slug: "sport-peak",
    description: "Performance athletic wear engineered for serious training.",
    logo: "/images/sellers/sport-peak.svg",
    joinedYear: 2022,
    rating: 4.5,
  },
  {
    id: "s4",
    name: "Modna Szafa",
    slug: "modna-szafa",
    description: "Polska moda na co dzien. Solidne podstawy garderoby w przystepnych cenach.",
    logo: "/images/sellers/modna-szafa.svg",
    joinedYear: 2022,
    rating: 4.8,
  },
  {
    id: "s5",
    name: "Sneaker Lab",
    slug: "sneaker-lab",
    description: "Curated sneaker collection. Every pair hand-picked for style and comfort.",
    logo: "/images/sellers/sneaker-lab.svg",
    joinedYear: 2023,
    rating: 4.4,
  },
  {
    id: "s6",
    name: "EcoThreads",
    slug: "eco-threads",
    description: "Sustainable fashion that doesn't compromise on style. Organic materials, fair production.",
    logo: "/images/sellers/eco-threads.svg",
    joinedYear: 2023,
    rating: 4.9,
  },
  {
    id: "s7",
    name: "Classic Fit",
    slug: "classic-fit",
    description: "Smart casual menswear. Clean lines, quality fabrics, everyday elegance.",
    logo: "/images/sellers/classic-fit.svg",
    joinedYear: 2023,
    rating: 4.3,
  },
  {
    id: "s8",
    name: "Marta Handmade",
    slug: "marta-handmade",
    description: "Recznie robione buty i akcesoria. Kazda para jest wyjatkowa.",
    logo: "/images/sellers/marta-handmade.svg",
    joinedYear: 2025,
    rating: 4.2,
  },
  {
    id: "s9",
    name: "VintageFind",
    slug: "vintage-find",
    description: "Pre-loved fashion treasures. Unique pieces with stories to tell.",
    logo: "/images/sellers/vintage-find.svg",
    joinedYear: 2025,
    rating: 4.0,
  },
  {
    id: "s10",
    name: "DropStyle",
    slug: "drop-style",
    description: "Trendy fashion at unbeatable prices. New drops every week.",
    logo: "/images/sellers/drop-style.svg",
    joinedYear: 2025,
    rating: 3.9,
  },
  {
    id: "s11",
    name: "Kasia Creates",
    slug: "kasia-creates",
    description: "Handcrafted accessories and jewelry. Designed in Warsaw, made with love.",
    logo: "/images/sellers/kasia-creates.svg",
    joinedYear: 2026,
    rating: 4.1,
  },
  {
    id: "s12",
    name: "FirstStep",
    slug: "first-step",
    description: "New on FashionHero. Casual basics for everyday wear.",
    logo: "/images/sellers/first-step.svg",
    joinedYear: 2026,
    rating: 0,
  },
];

export function getSeller(slug: string): Seller | undefined {
  return sellers.find((s) => s.slug === slug);
}

export function getSellerById(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}

export function getAllSellers(): Seller[] {
  return sellers;
}
