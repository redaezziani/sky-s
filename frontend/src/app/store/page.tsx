"use client";

import { useEffect, useRef } from "react";
import MainLayout from "@/components/store/main-layout";
import { ProductCard } from "@/components/store/product/product-card";
import Link from "next/link";
import { useHomeStore } from "@/stores/public/home-store";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";

const HomePage = () => {
  const {
    products,
    bestProducts,
    loading,
    error,
    fetchLatestProducts,
    fetchBestProducts,
  } = useHomeStore();

  const latestPrevRef = useRef<HTMLDivElement>(null);
  const latestNextRef = useRef<HTMLDivElement>(null);
  const bestPrevRef = useRef<HTMLDivElement>(null);
  const bestNextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLatestProducts(1, 15);
    fetchBestProducts(1, 15);
  }, [fetchLatestProducts, fetchBestProducts]);

  const renderProductsSection = (
    title: string,
    description: string,
    productList: typeof products,
    prevRef: React.RefObject<HTMLDivElement | null>,
    nextRef: React.RefObject<HTMLDivElement | null>
  ) => (
    <div className="w-full px-4 py-8">
      <div className="flex flex-col max-w-[90rem] w-full mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 w-full">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 mb-2"></div>
              <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <button
            onClick={() => {
              title === "Latest Products"
                ? fetchLatestProducts(1, 15)
                : fetchBestProducts(1, 15);
            }}
            className="bg-gray-900 text-white px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && productList.length > 0 && (
        <>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
            {productList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Mobile Swiper */}
          <div className="md:hidden relative">
            <div className="absolute -top-8 right-6 z-10 flex gap-2">
              <div ref={prevRef} className="p-2 cursor-pointer transition">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div ref={nextRef} className="p-2 cursor-pointer transition">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <Swiper
              spaceBetween={16}
              slidesPerView={1.2}
              modules={[Navigation]}
              onInit={(swiper) => {
                // connect custom refs
                (swiper.params.navigation as any).prevEl = prevRef.current;
                (swiper.params.navigation as any).nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }}
            >
              {productList.map((p) => (
                <SwiperSlide key={p.id}>
                  <ProductCard product={p} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {!loading && !error && productList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No products available at the moment
              </p>
              <Link
                href="/store"
                className="bg-gray-900 text-white px-4 py-2 hover:bg-gray-800 transition-colors inline-block"
              >
                Browse Store
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <MainLayout>
      {/* Latest Products Section */}
      {renderProductsSection(
        "Latest Products",
        "Check out our newest arrivals in the store",
        products,
        latestPrevRef,
        latestNextRef
      )}

      {/* Best Products Section */}
      {renderProductsSection(
        "Best Products",
        "Explore our top-rated or best-selling products",
        bestProducts,
        bestPrevRef,
        bestNextRef
      )}
    </MainLayout>
  );
};

export default HomePage;
