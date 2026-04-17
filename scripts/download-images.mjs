import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PRODUCTS_DIR = join(ROOT, "public/images/products");
const HERO_DIR = join(ROOT, "public/images/hero");

const productImages = [
  { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop", name: "product-1.jpg" },
  { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop", name: "product-2.jpg" },
  { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop", name: "product-3.jpg" },
  { url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=800&fit=crop", name: "product-4.jpg" },
  { url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop", name: "product-5.jpg" },
  { url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop", name: "product-6.jpg" },
  { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop", name: "product-7.jpg" },
  { url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop", name: "product-8.jpg" },
  { url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop", name: "product-9.jpg" },
  { url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop", name: "product-10.jpg" },
  { url: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800&h=800&fit=crop", name: "product-11.jpg" },
  { url: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&h=800&fit=crop", name: "product-12.jpg" },
  { url: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop", name: "product-13.jpg" },
  { url: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=800&fit=crop", name: "product-14.jpg" },
  { url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop", name: "product-15.jpg" },
  { url: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&h=800&fit=crop", name: "product-16.jpg" },
  // Tees
  { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop", name: "product-17.jpg" },
  { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop", name: "product-18.jpg" },
  { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop", name: "product-19.jpg" },
  // Hoodies
  { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop", name: "product-20.jpg" },
  { url: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&h=800&fit=crop", name: "product-21.jpg" },
  // Jackets
  { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop", name: "product-22.jpg" },
  { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop", name: "product-23.jpg" },
  // Joggers/pants
  { url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=800&fit=crop", name: "product-24.jpg" },
  { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop", name: "product-25.jpg" },
  // Socks
  { url: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&h=800&fit=crop", name: "product-26.jpg" },
  { url: "https://images.unsplash.com/photo-1610374792793-f016b77ca51a?w=800&h=800&fit=crop", name: "product-27.jpg" },
  // Bags
  { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop", name: "product-28.jpg" },
  { url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=800&fit=crop", name: "product-29.jpg" },
  // Beanies/caps
  { url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&h=800&fit=crop", name: "product-30.jpg" },
  { url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=800&fit=crop", name: "product-31.jpg" },
];

const heroImages = [
  { url: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1440&h=700&fit=crop", name: "hero-1.jpg" },
  { url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1440&h=700&fit=crop", name: "hero-2.jpg" },
  { url: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1440&h=700&fit=crop", name: "hero-3.jpg" },
];

const collectionHeroImages = [
  { url: "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=1440&h=400&fit=crop", name: "collection-hero-1.jpg" },
  { url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1440&h=400&fit=crop", name: "collection-hero-2.jpg" },
];

async function downloadImage(url, destPath) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destPath, buffer);
    console.log(`  OK: ${destPath.split("/public/")[1]} (${(buffer.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`  FAIL: ${destPath.split("/public/")[1]} — ${err.message}`);
  }
}

async function main() {
  if (!existsSync(PRODUCTS_DIR)) await mkdir(PRODUCTS_DIR, { recursive: true });
  if (!existsSync(HERO_DIR)) await mkdir(HERO_DIR, { recursive: true });

  console.log("Downloading product images...");
  for (const img of productImages) {
    await downloadImage(img.url, join(PRODUCTS_DIR, img.name));
  }

  console.log("\nDownloading hero images...");
  for (const img of heroImages) {
    await downloadImage(img.url, join(HERO_DIR, img.name));
  }

  console.log("\nDownloading collection hero images...");
  for (const img of collectionHeroImages) {
    await downloadImage(img.url, join(HERO_DIR, img.name));
  }

  console.log("\nDone!");
}

main();
