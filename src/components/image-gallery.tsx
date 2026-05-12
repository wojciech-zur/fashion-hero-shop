"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  colorName?: string;
  colorHex?: string;
}

/* Generate gradient placeholders that look intentional */
function galleryGradient(hex: string): string {
  return `radial-gradient(ellipse at 50% 55%, ${hex}44 0%, ${hex}22 35%, #ece9e2 65%)`;
}

function hasRealImage(src: string): boolean {
  return src.startsWith("/images/");
}

export function ImageGallery({ images, productName, colorName, colorHex = "#8a7d6b" }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex] || images[0];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — larger and more prominent, with zoom on hover */}
      <div
        ref={mainRef}
        className="relative aspect-square overflow-hidden cursor-zoom-in"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        style={{ background: galleryGradient(colorHex) }}
      >
        {hasRealImage(currentImage) ? (
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: isZooming ? "scale(2)" : "scale(1)",
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          >
            <Image
              src={currentImage}
              alt={`${productName}${colorName ? ` - ${colorName}` : ""}`}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
              transform: isZooming ? "scale(2)" : "scale(1)",
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          >
            <div className="relative w-3/5 h-2/5">
              <div
                className="absolute inset-0 rounded-[50%]"
                style={{
                  background: `linear-gradient(135deg, ${colorHex}88 0%, ${colorHex}44 100%)`,
                  transform: "rotate(-8deg) scaleX(1.6)",
                }}
              />
              <div
                className="absolute top-[-20%] left-[10%] w-[50%] h-[70%] rounded-[40%_60%_30%_70%]"
                style={{
                  background: `linear-gradient(180deg, ${colorHex}66 0%, ${colorHex}33 100%)`,
                  transform: "rotate(-15deg)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden border-2 transition-colors",
                selectedIndex === index
                  ? "border-charcoal"
                  : "border-transparent hover:border-warm-gray/40"
              )}
              style={{ background: galleryGradient(colorHex) }}
            >
              {hasRealImage(image) ? (
                <Image
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative w-3/5 h-2/5">
                    <div
                      className="absolute inset-0 rounded-[50%] opacity-60"
                      style={{
                        background: `${colorHex}66`,
                        transform: "rotate(-8deg) scaleX(1.4)",
                      }}
                    />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
