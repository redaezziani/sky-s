"use client";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { ChartTopProducts } from "@/components/chart-top-products";
import { ChartTopProductsRadar } from "@/components/radar-chat";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="px-4 lg:px-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChartTopProducts />
            <ChartTopProductsRadar />
          </div>
        </div>
      </div>
    </div>
  );
}
