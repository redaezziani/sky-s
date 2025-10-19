"use client";

import * as React from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartContainer,
  ChartConfig,
  ChartTooltip,
} from "@/components/ui/chart";
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

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export function ChartCategoryPerformance() {
  const { locale } = useLocale();
  const t =
    getMessages(locale).pages.analytics.components.chartCategoryPerformance;

  const [timeRange, setTimeRange] = React.useState("30d");
  const [period, setPeriod] = React.useState(30);

  React.useEffect(() => {
    if (timeRange === "90d") setPeriod(90);
    else if (timeRange === "30d") setPeriod(30);
    else setPeriod(7);
  }, [timeRange]);

  const { data: rawData } = useSWR(
    `/analytics/category-performance?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const processedData = React.useMemo(() => {
    if (!rawData) return [];

    type AggregatedCategory = {
      categoryName: string;
      originalName: string;
      totalOrders: number;
      totalRevenue: number;
      totalProducts: number;
    };

    const aggregatedData: { [category: string]: AggregatedCategory } = {};
    rawData.forEach((day: Record<string, any>) => {
      const categories = Object.keys(day).filter((key) => key !== "date");
      categories.forEach((category) => {
        if (!aggregatedData[category]) {
          aggregatedData[category] = {
            categoryName: category,
            originalName: category,
            totalOrders: 0,
            totalRevenue: 0,
            totalProducts: 0,
          };
        }
        aggregatedData[category].totalOrders += day[category].totalOrders;
        aggregatedData[category].totalRevenue += day[category].totalRevenue;
        aggregatedData[category].totalProducts += day[category].totalProducts;
      });
    });

    const formattedData = Object.values(aggregatedData);

    return formattedData.map((item) => ({
      ...item,
      categoryName: truncateText(item.originalName, 15),
    }));
  }, [rawData]);

  const chartConfig = {
    totalOrders: {
      label: t.labels?.totalOrders || "Total Orders",
      color: "var(--chart-1)",
    },
    totalRevenue: {
      label: t.labels?.totalRevenue || "Total Revenue",
      color: "#ff3fe1",
    },
    totalProducts: {
      label: t.labels?.totalProducts || "Total Products",
      color: "var(--chart-3)",
    },
    label: { color: "var(--foreground)" },
  };

  return (
    <Card className="@container/card max-h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{t.title}</CardTitle>
            <CardDescription className="text-sm">
              {t.description}
            </CardDescription>
          </div>
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
                {t.periods["90d"]}
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="px-3 py-1 text-xs">
                {t.periods["30d"]}
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="px-3 py-1 text-xs">
                {t.periods["7d"]}
              </ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-32 h-8 @[500px]/card:hidden"
                size="sm"
              >
                <SelectValue placeholder={t.selectPeriodPlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d">{t.periods["90d"]}</SelectItem>
                <SelectItem value="30d">{t.periods["30d"]}</SelectItem>
                <SelectItem value="7d">{t.periods["7d"]}</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-3 sm:px-4">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="categoryName"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            {/* Hidden Y-axis for Orders and Products */}
            <YAxis yAxisId="ordersAndProducts" hide />
            {/* Hidden Y-axis for Revenue */}
            <YAxis yAxisId="revenue" hide />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.1 }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md min-w-[200px]">
                      <div className="text-sm font-medium mb-2">
                        {data.originalName || data.categoryName}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center">
                            <div
                              className="w-2 h-2 rounded-full mr-2"
                              style={{
                                backgroundColor: chartConfig.totalOrders.color,
                              }}
                            />
                            {t.labels?.totalOrders || "Total Orders"}:
                          </span>
                          <span className="font-medium">
                            {data.totalOrders}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center">
                            <div
                              className="w-2 h-2 rounded-full mr-2"
                              style={{
                                backgroundColor: chartConfig.totalRevenue.color,
                              }}
                            />
                            {t.labels?.totalRevenue || "Total Revenue"}:
                          </span>
                          <span className="font-medium">
                            ${data.totalRevenue?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center">
                            <div
                              className="w-2 h-2 rounded-full mr-2"
                              style={{
                                backgroundColor:
                                  chartConfig.totalProducts.color,
                              }}
                            />
                            {t.labels?.totalProducts || "Total Products"}:
                          </span>
                          <span className="font-medium">
                            {data.totalProducts}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Orders and Products are stacked on their own hidden axis */}
            <Bar
              yAxisId="ordersAndProducts"
              dataKey="totalOrders"
              stackId="a"
              fill={chartConfig.totalOrders.color}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="ordersAndProducts"
              dataKey="totalProducts"
              stackId="a"
              fill={chartConfig.totalProducts.color}
              radius={[0, 0, 0, 0]}
            />
            {/* Revenue is on its own hidden axis, placed next to the stacked bar */}
            <Bar
              yAxisId="revenue"
              dataKey="totalRevenue"
              fill={chartConfig.totalRevenue.color}
              radius={[4, 4, 4, 4]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
