"use client";

import * as React from "react";
import useSWR from "swr";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { fetcher } from "@/lib/utils";

// --- Product Data Type ---
type ProductItem = {
  label: string;
  totalOrdered: number;
  totalRevenue: number;
  color: string;
  id: string;
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// =================================================================
// New Component: ProductProgressBar
// =================================================================

interface ProductProgressBarProps {
  data: ProductItem[];
  totalOrders: number;
}

/**
 * A multi-color progress bar using CSS Grid to represent product order breakdown.
 */
function ProductProgressBar({ data, totalOrders }: ProductProgressBarProps) {
  if (totalOrders === 0 || data.length === 0) {
    return <div className="h-3 w-full rounded-full bg-gray-200"></div>;
  }

  const gridColumns = data
    .map((item) => {
      const percentage = (item.totalOrdered / totalOrders) * 100;
      return `${percentage}fr`;
    })
    .join(" ");

  return (
    <div
      className="grid w-full rounded h-3 overflow-hidden bg-gray-200 shadow-inner"
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      {data.map((item) => (
        <div
          key={item.id}
          className="h-full"
          style={{ backgroundColor: item.color }}
        ></div>
      ))}
    </div>
  );
}

// =================================================================
// Main Component: ChartTopProducts
// =================================================================

export function ChartTopProducts() {
  const { locale } = useLocale();
  const t = getMessages(locale).pages.analytics.components.chartTopProducts;

  const [timeRange, setTimeRange] = React.useState("90d");
  const [period, setPeriod] = React.useState(90);

  React.useEffect(() => {
    if (timeRange === "90d") setPeriod(90);
    else if (timeRange === "30d") setPeriod(30);
    else setPeriod(7);
  }, [timeRange]);

  const { data: topProductsMetrics } = useSWR(
    `/analytics/top-products-metrics?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Process data to get the top 5 products and assign colors
  const processedData = React.useMemo(() => {
    if (!topProductsMetrics || topProductsMetrics.length === 0) return [];

    const chartColors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    // Sort by totalOrdered (highest first) and take top 5
    const sortedData = [...topProductsMetrics].sort(
      (a: any, b: any) => b.totalOrdered - a.totalOrdered
    );

    return sortedData.slice(0, 5).map((item: any, index: number) => ({
      label: item.label,
      productName: truncateText(item.label || "", 30),
      totalOrdered: item.totalOrdered,
      totalRevenue: item.totalRevenue,
      color: chartColors[index % chartColors.length],
      id: `product-${index}`,
    }));
  }, [topProductsMetrics]);

  // Calculate the total orders for the displayed top 5 products
  const totalOrders = processedData.reduce(
    (sum, item) => sum + item.totalOrdered,
    0
  );

  return (
    <Card className="@container/card max-h-[27rem]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {t.title || "Top 5 Products"}
            </CardTitle>
            <CardDescription className="text-sm">
              {t.description ||
                "Breakdown of top-selling products by total orders."}
            </CardDescription>
          </div>
          {/* Time Range Selector */}
          <CardAction className="shrink-0">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              size="sm"
              className="hidden @[500px]/card:flex"
            >
              <ToggleGroupItem value="90d" className="px-3 py-1 text-xs">
                {t.periods?.["90d"] || "90D"}
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="px-3 py-1 text-xs">
                {t.periods?.["30d"] || "30D"}
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="px-3 py-1 text-xs">
                {t.periods?.["7d"] || "7D"}
              </ToggleGroupItem>
            </ToggleGroup>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-32 h-8 @[500px]/card:hidden"
                size="sm"
              >
                <SelectValue
                  placeholder={t.selectPeriodPlaceholder || "Select period"}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d">
                  {t.periods?.["90d"] || "90 Days"}
                </SelectItem>
                <SelectItem value="30d">
                  {t.periods?.["30d"] || "30 Days"}
                </SelectItem>
                <SelectItem value="7d">
                  {t.periods?.["7d"] || "7 Days"}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="px-4 pt-0 pb-4">
        {/* --- Product Orders Summary --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">
            {totalOrders.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">
            {t.labels?.totalOrdered || "Total Orders"} (Top 5)
          </div>
        </div>

        {/* --- Multi-Color Progress Bar --- */}
        <ProductProgressBar data={processedData} totalOrders={totalOrders} />

        {/* --- Legend / Details --- */}
        <div className="mt-4 space-y-2">
          {processedData.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                {/* Colored dot for the legend */}
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span
                  className="text-muted-foreground truncate"
                  title={item.label}
                >
                  {item.productName}
                </span>
              </div>
              {/* Order count for the product */}
              <span className="font-medium shrink-0 ml-4">
                {item.totalOrdered.toLocaleString()}{" "}
                {t.labels?.orders || "Orders"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
