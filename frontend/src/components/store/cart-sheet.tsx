"use client";

import { useCartStore, CartItem } from "@/stores/public/cart-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Image from "next/image";

export default function CartSheet() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  // Empty cart state
  if (!items.length) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button className="relative p-2 hover:bg-gray-50 rounded-full transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] p-0 bg-white border-l">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <SheetTitle className="text-lg font-semibold text-gray-900">
                Bag
              </SheetTitle>
            </div>

            {/* Empty state */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your bag is empty
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Items in your bag are not reserved — check out now to make them
                yours.
              </p>
              <SheetClose asChild>
                <button className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Continue Shopping
                </button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-gray-50 rounded-full transition-colors">
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
          {/* Item count badge */}
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs font-medium min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
            {totalItems}
          </span>
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] p-0 bg-white border-l">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold text-gray-900">
                Bag
              </SheetTitle>
              <span className="text-sm text-gray-500">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6">
              {items.map((item: CartItem) => (
                <div key={item.skuId} className="flex gap-4">
                  {/* Product image */}
                  {item.coverImage && (
                    <div className="w-20 h-20 bg-gray-50 flex-shrink-0">
                      <img
                        src={item.coverImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {item.productName}
                    </h3>
                    {item.shortDesc && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {item.shortDesc}
                      </p>
                    )}

                    {/* Price and quantity row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        ${item.price}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.skuId,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="px-2 py-1 hover:bg-gray-50 text-sm"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-sm border-l border-r border-gray-300 min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.skuId, item.quantity + 1)
                            }
                            className="px-2 py-1 hover:bg-gray-50 text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.skuId)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with total and actions */}
          <div className="border-t bg-gray-50">
            <div className="px-6 py-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900">
                  Subtotal
                </span>
                <span className="text-base font-semibold text-gray-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {/* Shipping notice */}
              <p className="text-xs text-gray-500">
                Shipping and taxes calculated at checkout
              </p>

              {/* Action buttons */}
              <div className="space-y-2">
                <SheetClose asChild>
                  <button className="w-full flex justify-center items-center gap-1 bg-primary text-white py-3 text-sm font-medium hover:bg-primary transition-colors">
                    Checkout
                    
                    <svg
                    
                    className="inline w-5 h-5 "
                    fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M8 4v2h4v2H6v2h6V8h2v2h8v6h-2v-4H4v6h14v-2h2v2h4v2H0v-2h2v-8h2V6h2V4h2z" fill="currentColor"/> </svg>
                  </button>
                </SheetClose>
                <button
                  onClick={clearCart}
                  className="w-full text-gray-600 py-2 text-xs hover:text-gray-900 transition-colors underline"
                >
                  Clear bag
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
