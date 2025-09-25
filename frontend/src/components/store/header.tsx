"use client";

import { useEffect } from "react";
import Link from "next/link";
import UserMenu from "./user-menu";
import { Search, Menu, X } from "lucide-react";
import { useCategoryStore } from "@/stores/public/category-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const Header = () => {
  const { categories, loading, error, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <header className="fixed top-0 left-0 py-3 w-full flex flex-col gap-3 justify-start items-center  backdrop-blur-sm border-b z-50">
      <section className="w-full max-w-[110rem] gap-4 flex justify-between items-center px-4">
        {/* Mobile Menu Button - Only visible on mobile */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <svg
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-6 h-6"
              >
                {" "}
                <path
                  d="M20 5H4v2h16V5zm0 4H4v2h16V9zM4 13h16v2H4v-2zm16 4H4v2h16v-2z"
                  fill="currentColor"
                />{" "}
              </svg>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="px-3 pb-4 border-b">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col  px-3">
                {/* Search Section */}
                <div className="flex items-end gap-3 mt-3">
                  <Search className="w-5 h-5 " />
                  <span className=" text-sm underline">
                    Search for products
                  </span>
                </div>

                {/* Categories */}
                <div className="space-y-1 mt-8 mb-4">
                  <h3 className="font-medium text-sm  uppercase tracking-wide mb-3">
                    Categories
                  </h3>
                  {loading && <p className="text-sm  py-2">Loading...</p>}
                  {error && (
                    <p className="text-sm text-red-500 py-2">
                      Failed to load categories
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {!loading &&
                      !error &&
                      categories.map((category) => (
                        <SheetClose asChild key={category.id}>
                          <Link
                            href={`/store/category/${category.slug}`}
                            className=" hover:underline text-sm transition-all duration-200"
                          >
                            {category.name}
                          </Link>
                        </SheetClose>
                      ))}
                  </div>
                </div>

                {/* Store Actions */}
                <div className="space-y-3 pt-8  border-t">
                  <div className="flex items-center gap-3 p-3 hover: rounded-lg transition-colors cursor-pointer">
                    <svg
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path
                        d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className=" underline text-sm">Wishlist</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 hover: rounded-lg transition-colors cursor-pointer">
                    <svg
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path
                        d="M9 2h6v2H9V2zm6 4V4h2v2h4v16H3V6h4V4h2v2h6zm0 2H9v2H7V8H5v12h14V8h-2v2h-2V8z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className=" underline text-sm">Cart</span>
                  </div>
                  <SheetClose asChild>
                    <Link
                      href="/store"
                      className="flex items-center gap-3 p-3 hover: rounded-lg transition-colors"
                    >
                      <span className=" font-medium">reda store</span>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/store" className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 160"
            className="h-8 w-8 md:h-11 md:w-11"
          >
            <path
              fill="currentColor"
              d="M 75.36,45.39 C 80.93,35.58 86.31,26.09 92.56,15.10 C 119.73,63.00 145.09,109.48 170.40,155.88 C 169.04,157.80 167.65,157.30 166.40,157.30 C 151.24,157.35 136.08,157.24 120.92,157.43 C 118.89,157.47 117.64,156.09 116.65,153.63 C 99.72,120.88 82.67,88.19 65.56,55.54 C 64.37,53.63 64.13,52.28 65.39,50.29 C 68.18,45.21 70.61,39.92 75.36,45.39 Z"
            />
            <path
              fill="currentColor"
              d="M 15.00,157.32 C 9.54,157.33 4.58,157.33 -1.22,157.33 C 9.28,138.97 19.04,121.87 29.59,103.42 C 40.12,121.82 50.84,138.85 62.40,157.32 C 49.61,157.32 38.56,157.32 15.00,157.32 Z"
            />
          </svg>
        </Link>

        {/* Desktop Search - Hidden on mobile */}
        <div className="hidden md:flex justify-center cursor-pointer gap-2 items-center">
          <Search className="w-5 h-5" />
          <p className="underline">Search for products</p>
        </div>

        {/* Desktop Actions - Hidden on mobile */}
        <div className="hidden md:flex justify-center gap-6 items-center">
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-5 h-5 cursor-pointer"
          >
            <path
              d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z"
              fill="currentColor"
            />
          </svg>
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
          <p className="underline cursor-pointer">reda store</p>
        </div>

        {/* Mobile Actions - Only visible on mobile */}
        <div className="md:hidden flex items-center gap-3">
          <Search className="w-5 h-5 cursor-pointer" />
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
        </div>
      </section>

      {/* Desktop Categories Navigation */}
      <div className="md:flex hidden w-full mt-4 max-w-[110rem] justify-start items-start gap-6 px-4">
        {loading && <p className="text-sm ">Loading...</p>}
        {error && (
          <p className="text-sm text-red-500">Failed to load categories</p>
        )}
        {!loading &&
          !error &&
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/store/category/${category.slug}`}
              className="hover:underline transition-all duration-200"
            >
              {category.name}
            </Link>
          ))}
      </div>
    </header>
  );
};

export default Header;
