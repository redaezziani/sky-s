"use client";

import React from "react";
import { useProductDetailsStore, Variant } from "@/stores/public/product-details-store";
import { useCartStore } from "@/stores/public/cart-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// --- Utility Functions ---
const getVariantDisplayValue = (variant: Variant) => {
  if (variant.attributes.color) return variant.attributes.color;

  const attributesKeys = Object.keys(variant.attributes);
  if (attributesKeys.length === 1) {
    return variant.attributes[attributesKeys[0]];
  }

  return variant.name;
};

const getVariantLabel = (productVariants: Variant[], currentVariant: Variant | undefined) => {
    const hasColorVariants = productVariants.every(
        (v) => v.attributes && v.attributes.color
    );
    
    let variantLabel = "Option";
    if (hasColorVariants) {
        variantLabel = "Color";
    } else if (currentVariant && Object.keys(currentVariant.attributes).length > 0) {
        const primaryAttrKey = Object.keys(currentVariant.attributes)[0];
        if (primaryAttrKey) {
            variantLabel = primaryAttrKey.charAt(0).toUpperCase() + primaryAttrKey.slice(1);
        }
    }
    return variantLabel;
}

const ProductDetails = () => {
  // 💡 FIX: Use separate selectors to avoid creating new objects on every render
  const product = useProductDetailsStore((state) => state.product);
  const selectedVariantIndex = useProductDetailsStore((state) => state.selectedVariantIndex);
  const selectedSkuId = useProductDetailsStore((state) => state.selectedSkuId);
  const setSelectedVariantIndex = useProductDetailsStore((state) => state.setSelectedVariantIndex);
  const setSelectedSkuId = useProductDetailsStore((state) => state.setSelectedSkuId);
  
  // 💡 FIX: Calculate derived values directly in component instead of selector
  const currentVariant = product?.variants[selectedVariantIndex];
  const selectedSkuObject = currentVariant?.skus.find((s) => s.id === selectedSkuId);

  // Cart store action
  const addItem = useCartStore((state) => state.addItem);

  if (!product || !currentVariant) return null;

  // --- Derived Values ---
  const displayPrice = selectedSkuObject
    ? selectedSkuObject.price
    : product.startingPrice;
  
  const hasColorVariants = product.variants.every(
    (v) => v.attributes && v.attributes.color
  );
  const currentVariantDisplayValue = getVariantDisplayValue(currentVariant);
  const variantLabel = getVariantLabel(product.variants, currentVariant);

  // --- Handlers ---
  const handleVariantChange = (idx: number, variant: Variant) => {
    setSelectedVariantIndex(idx);
    // Find the first available SKU of the new variant and set it as selected
    const firstAvailableSku = variant.skus.find((s) => s.stock > 0);
    setSelectedSkuId(firstAvailableSku ? firstAvailableSku.id : null);
  };

  const handleAddToCart = () => {
    if (!selectedSkuId || !selectedSkuObject) {
      toast.error("Please select a size before adding to bag.");
      return;
    }

    addItem({
      skuId: selectedSkuObject.id,
      quantity: 1,
      productId: product.id,
      productName: product.name,
      shortDesc: product.shortDesc,
      coverImage: selectedSkuObject.coverImage || product.coverImage,
      price: selectedSkuObject.price,
    });
    toast.success(`Added ${product.name} to bag!`);
  };

  return (
    <div className="space-y-6 col-span-2">
      {/* Category */}
      {product.categories.length > 0 && (
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {product.categories[0].name}
        </p>
      )}

      {/* Name & short desc */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {product.name}
        </h1>
        <p className="text-sm text-gray-600">{product.shortDesc}</p>
      </div>

      {/* Price */}
      <p className="text-xl font-semibold text-gray-900">
        ${displayPrice.toFixed(2)}
      </p>

      {/* Variant selector (Generalized) */}
      {product.variants.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {variantLabel}: {currentVariantDisplayValue}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {product.variants.map((v, idx) => {
              const displayValue = getVariantDisplayValue(v);

              if (hasColorVariants) {
                // RENDER COLOR PICKER BUTTONS
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(idx, v)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedVariantIndex === idx
                        ? "border-gray-900 shadow-md"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ backgroundColor: displayValue.toLowerCase() }}
                    title={displayValue}
                  />
                );
              } else {
                // RENDER GENERAL ATTRIBUTE BUTTONS
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(idx, v)}
                    className={`min-w-[4rem] px-4 py-2 rounded border text-sm font-medium transition-colors ${
                      selectedVariantIndex === idx
                        ? " bg-secondary text-primary border border-primary"
                        : "border-gray-300 text-gray-900 hover:border-gray-500"
                    }`}
                  >
                    {displayValue}
                  </button>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Size/Volume selector - Only show if multiple SKUs exist OR if single SKU has size/volume variations */}
      {(() => {
        // Check if we have multiple SKUs or if SKUs have different size/volume values
        const hasMultipleSizes = currentVariant.skus.length > 1;
        const firstSku = currentVariant.skus[0];
        const hasSizeOrVolume = firstSku?.dimensions?.size || (firstSku?.dimensions as any)?.volume;
        
        // Determine what type of dimension we're dealing with
        const isVolumeProduct = currentVariant.skus.some(sku => (sku.dimensions as any).volume);
        const isSizeProduct = currentVariant.skus.some(sku => sku.dimensions.size);
        
        // Only render if we have multiple SKUs and they have size/volume info
        if (!hasMultipleSizes || !hasSizeOrVolume) return null;
        
        return (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {isVolumeProduct ? 'Volume' : isSizeProduct ? 'Size' : 'Options'}
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {currentVariant.skus
                .sort((a, b) => {
                  // Sort by size for clothing
                  if (a.dimensions.size && b.dimensions.size) {
                    const sizeOrder: { [key: string]: number } = {
                      XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6,
                    };
                    return (
                      (sizeOrder[a.dimensions.size] || 99) -
                      (sizeOrder[b.dimensions.size] || 99)
                    );
                  }
                  
                  // Sort by volume for perfumes (30ml, 50ml, 100ml, etc.)
                  const aVolume = (a.dimensions as any).volume;
                  const bVolume = (b.dimensions as any).volume;
                  if (aVolume && bVolume) {
                    const volumeA = parseInt(aVolume.replace(/[^\d]/g, ''));
                    const volumeB = parseInt(bVolume.replace(/[^\d]/g, ''));
                    return volumeA - volumeB;
                  }
                  
                  return 0;
                })
                .map((sku) => {
                  // Prioritize volume over size for display
                  const displayValue = (sku.dimensions as any).volume || sku.dimensions.size || 'N/A';
                  
                  return (
                    <button
                      key={sku.id}
                      onClick={() => setSelectedSkuId(sku.id)}
                      disabled={sku.stock <= 0}
                      className={`h-10 border text-sm font-medium transition-all ${
                        selectedSkuId === sku.id
                          ? "border-primary bg-primary text-white"
                          : sku.stock > 0
                          ? "border-gray-300 text-gray-900 hover:border-primary"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {sku.stock <= 0 ? (
                        <span className="line-through">{displayValue}</span>
                      ) : (
                        displayValue
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })()}

      {/* Add to cart */}
      <div className="space-y-3 md:max-w-md">
        <Button
          onClick={handleAddToCart}
          size={"lg"}
          disabled={!selectedSkuId || !product.inStock}
          className=" flex w-full justify-center items-center gap-2 py-3 text-sm font-medium"
        >
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-5 h-5 cursor-pointer"
          >
            <path
              d="M9 2h6v2H9V2zm6 4V4h2v2h4v16H3V6h4V4h2v2h6zm0 2H9v2H7V8H5v12h14V8h-2v2h-2V8z"
              fill="currentColor"
            />
          </svg>
          {product.inStock ? "Add to Bag" : "Out of Stock"}
        </Button>

        <Button
          variant="outline"
          size={"lg"}
         className=" flex w-full justify-center items-center gap-2 py-3 text-sm font-medium">
          <svg
            className="w-5 h-5 cursor-pointer"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 2H5v2H3v2H1v6h2v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v-2h2v-2h2V6h-2V4h-2V2h-4v2h-2v2h-2V4H9V2zm0 2v2h2v2h2V6h2V4h4v2h2v6h-2v2h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2H3V6h2V4h4z"
              fill="currentColor"
            />
          </svg>
          Favorite Item
        </Button>
      </div>

      {/* Full description */}
      <div className="text-sm text-gray-600 leading-relaxed">
        {product.description}
      </div>

      {/* Collapsible info */}
      <div className="space-y-4 text-sm">
        <details className="border-t border-gray-200 pt-4">
          <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
            Free Delivery & Returns
          </summary>
          <p className="mt-2 text-gray-600">
            Free delivery on orders over $100. Free returns within 30 days.
          </p>
        </details>

        <details className="border-t border-gray-200 pt-4">
          <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
            Product Details
          </summary>
          <ul className="mt-2 text-gray-600 space-y-1">
            <li>• Premium quality materials</li>
            <li>• Durable construction</li>
            <li>• Comfortable fit</li>
          </ul>
        </details>

        {product.avgRating > 0 && (
          <div className="border-t border-gray-200 pt-4 flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.floor(product.avgRating)
                      ? "text-gray-900"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.avgRating.toFixed(1)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;