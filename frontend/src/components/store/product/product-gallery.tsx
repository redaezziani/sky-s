"use client";

import React, { useState, useEffect } from "react";
import { useProductDetailsStore } from "@/stores/public/product-details-store";

const ProductGallery = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 💡 FIX: Use separate selectors to avoid object recreation
  const product = useProductDetailsStore((state) => state.product);
  const selectedVariantIndex = useProductDetailsStore((state) => state.selectedVariantIndex);
  const selectedSkuId = useProductDetailsStore((state) => state.selectedSkuId);

  // 💡 FIX: Calculate derived values directly in component
  const currentVariant = product?.variants[selectedVariantIndex];
  const currentSku = currentVariant?.skus.find((s) => s.id === selectedSkuId);
  
  // Determine the images to display
  const images = currentSku?.images.length
    ? currentSku.images
    : currentSku?.coverImage
    ? [currentSku.coverImage]
    : [product?.coverImage || ""];

  // Reset selected image index when variant or sku changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariantIndex, selectedSkuId]);

  if (!product) return null;

  return (
    <div className="space-y-4 w-full md:max-w-[28rem] mx-left">
      <div className="bg-gray-50 border border-input  rounded overflow-hidden">
        <img
          src={images[selectedImageIndex] || product.coverImage}
          alt={product.name}
          className="w-full h-full   object-cover scale-105 transition-transform duration-500"
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {images.slice(0, 5).map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImageIndex(idx)}
            className={`aspect-auto bg-gray-50 overflow-hidden rounded border-2 transition-colors ${
              selectedImageIndex === idx
                ? "border-primary/80"
                : "border-input hover:border-gray-300"
            }`}
          >
            <img
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;