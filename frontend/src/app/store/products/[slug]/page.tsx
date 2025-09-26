"use client";

import MainLayout from "@/components/store/main-layout";
import React, { useState, useEffect } from "react";
import { useCartStore } from "@/stores/public/cart-store";
import swr from "swr";
import { fetcher, axiosInstance } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  coverImage: string;
  metaTitle: string;
  metaDesc: string;
  categories: { id: string; name: string; slug: string }[];
  variants: {
    id: string;
    name: string;
    attributes: { color: string };
    skus: {
      id: string;
      sku: string;
      price: number;
      stock: number;
      dimensions: {
        size: string;
        width: number;
        height: number;
        length: number;
      };
      coverImage: string;
      images: string[];
      createdAt: string;
      updatedAt: string;
    }[];
  }[];
  startingPrice: number;
  inStock: boolean;
  totalStock: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
};

type ProductPageProps = {
  params: { slug: string };
};

const ProductPage = ({ params }: ProductPageProps) => {
  const { slug } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States to be shared between gallery and details
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const handelFetchProduct = async () => {
    try {
      const res = await axiosInstance.get<Product>(`/public/products/${slug}`);
      setProduct(res.data);
      // Set default selected SKU to the first available SKU of the first variant
      if (res.data.variants.length > 0) {
        const firstAvailableSku = res.data.variants[0].skus.find(
          (s) => s.stock > 0
        );
        setSelectedSku(firstAvailableSku ? firstAvailableSku.id : null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handelFetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <MainLayout title="Loading..." description="Loading product details">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p>Loading product...</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout
        title="Product not found"
        description="No product details available"
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p>Product not found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={product.name}
      description={product.metaDesc || product.shortDesc}
    >
      <div className="w-full px-4 py-8">
        <div className="grid max-w-6xl lg:grid-cols-2 gap-12">
          <ProductGallery
            product={product}
            selectedVariant={selectedVariant}
            selectedSku={selectedSku}
          />
          <ProductDetails
            product={product}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
            selectedSku={selectedSku}
            setSelectedSku={setSelectedSku}
          />
        </div>
      </div>
    </MainLayout>
  );
};

// ================== Product Gallery ==================
const ProductGallery = ({
  product,
  selectedVariant,
  selectedSku,
}: {
  product: Product;
  selectedVariant: number;
  selectedSku: string | null;
}) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const currentVariant = product.variants[selectedVariant];
  const currentSku = currentVariant?.skus.find((s) => s.id === selectedSku);

  const images = currentSku?.images.length
    ? currentSku.images
    : currentSku?.coverImage
    ? [currentSku.coverImage]
    : [product.coverImage];

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant, selectedSku]);

  return (
    <div className="space-y-4 max-w-[28rem] mx-auto">
      <div className="bg-gray-50 overflow-hidden">
        <img
          src={images[selectedImage]}
          alt={product.name}
          className="w-full h-full object-cover scale-105 transition-transform duration-500"
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {images.slice(0, 5).map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`aspect-square bg-gray-50 overflow-hidden border-2 transition-colors ${
              selectedImage === idx
                ? "border-gray-900"
                : "border-transparent hover:border-gray-400"
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
// ================== Product Details ==================
const ProductDetails = ({
  product,
  selectedVariant,
  setSelectedVariant,
  selectedSku,
  setSelectedSku,
}: {
  product: Product;
  selectedVariant: number;
  setSelectedVariant: React.Dispatch<React.SetStateAction<number>>;
  selectedSku: string | null;
  setSelectedSku: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const currentVariant = product.variants[selectedVariant];

  // Find the selected SKU object to get its price
  const selectedSkuObject = currentVariant?.skus.find(
    (s) => s.id === selectedSku
  );
  const displayPrice = selectedSkuObject
    ? selectedSkuObject.price
    : product.startingPrice;

  const handleAddToCart = () => {
    if (!selectedSku) {
      alert("Please select a size before adding to bag.");
      return;
    }

    const sku = currentVariant.skus.find((s) => s.id === selectedSku);
    if (!sku) return;

    addItem({
      skuId: sku.id,
      quantity: 1,
      productId: product.id,
      productName: product.name,
      shortDesc: product.shortDesc,
      coverImage: sku.coverImage || product.coverImage,
      price: sku.price,
    });
    toast.success(`Added ${product.name} to bag!`);
  };

  // --- NEW LOGIC START ---

  const hasColorVariants = product.variants.every(
    (v) => v.attributes && v.attributes.color
  );
  
  // Get the display value for the current variant selector.
  // It checks for 'color', then for any other single attribute (like 'size' for perfume),
  // and finally falls back to the variant's 'name'.
  const getVariantDisplayValue = (variant: typeof product.variants[0]) => {
    if (variant.attributes.color) return variant.attributes.color;

    // Fallback: If no color, check for other attributes (e.g., 'size' for perfume)
    const attributesKeys = Object.keys(variant.attributes);
    if (attributesKeys.length === 1) {
      return variant.attributes[attributesKeys[0] as keyof typeof variant.attributes];
    }

    return variant.name; // Fallback to variant name
  };

  const currentVariantDisplayValue = getVariantDisplayValue(currentVariant);

  // Determine the primary attribute name for the selector label (e.g., "Color", "Volume", "Type")
  let variantLabel = "Option";
  if (hasColorVariants) {
    variantLabel = "Color";
  } else if (currentVariant && Object.keys(currentVariant.attributes).length > 0) {
    // If no color, try to get a label from the first variant's first attribute key
    const primaryAttrKey = Object.keys(currentVariant.attributes)[0];
    if (primaryAttrKey) {
        // Simple capitalization: e.g., 'size' -> 'Size', 'volume' -> 'Volume'
        variantLabel = primaryAttrKey.charAt(0).toUpperCase() + primaryAttrKey.slice(1);
    }
  }


  // --- NEW LOGIC END ---


  return (
    <div className="space-y-6">
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
                    onClick={() => {
                      setSelectedVariant(idx);
                      // Find the first available SKU of the new variant and set it as selected
                      const firstAvailableSku = v.skus.find((s) => s.stock > 0);
                      setSelectedSku(
                        firstAvailableSku ? firstAvailableSku.id : null
                      );
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedVariant === idx
                        ? "border-gray-900 shadow-md"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{
                      backgroundColor: displayValue.toLowerCase(),
                    }}
                    title={displayValue}
                  />
                );
              } else {
                // RENDER GENERAL ATTRIBUTE BUTTONS (e.g., for Size/Volume)
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(idx);
                      // Find the first available SKU of the new variant and set it as selected
                      const firstAvailableSku = v.skus.find((s) => s.stock > 0);
                      setSelectedSku(
                        firstAvailableSku ? firstAvailableSku.id : null
                      );
                    }}
                    className={`min-w-[4rem] px-4 py-2 border text-sm font-medium transition-colors ${
                      selectedVariant === idx
                        ? "border-gray-900 bg-gray-900 text-white"
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

      {/* Size selector */}
      {currentVariant?.skus.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {currentVariant.skus
              .sort((a, b) => {
                const sizeOrder: { [key: string]: number } = {
                  XS: 1,
                  S: 2,
                  M: 3,
                  L: 4,
                  XL: 5,
                };
                return (
                  (sizeOrder[a.dimensions.size] || 99) -
                  (sizeOrder[b.dimensions.size] || 99)
                );
              })
              .map((sku) => (
                <button
                  key={sku.id}
                  onClick={() => setSelectedSku(sku.id)}
                  disabled={sku.stock <= 0}
                  className={`h-10 border text-sm font-medium transition-all ${
                    selectedSku === sku.id
                      ? "border-primary bg-primary text-white"
                      : sku.stock > 0
                      ? "border-gray-300 text-gray-900 hover:border-primary"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sku.stock <= 0 ? (
                    <span className="line-through">{sku.dimensions.size}</span>
                  ) : (
                    sku.dimensions.size
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Add to cart */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={!selectedSku || !product.inStock}
          className="w-full bg-primary text-white flex gap-2 justify-center items-center py-3 text-sm font-medium tracking-wide transition-colors hover:bg-primary disabled:bg-gray-400"
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
        </button>

        <button className="w-full border border-gray-300 flex gap-2 justify-center items-center text-gray-900 py-3 text-sm font-medium transition-colors hover:border-gray-900">
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-5 h-5 cursor-pointer"
          >
            {" "}
            <path
              d="M9 2H5v2H3v2H1v6h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v-2h2v-2h2V6h-2V4h-2V2h-4v2h-2v2h-2V4H9V2zm0 2v2h2v2h2V6h2V4h4v2h2v6h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2H3V6h2V4h4z"
              fill="currentColor"
            />{" "}
          </svg>
          Favorite Item
        </button>
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

export default ProductPage;
