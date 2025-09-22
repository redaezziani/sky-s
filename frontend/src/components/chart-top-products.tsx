"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
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
  ChartTooltipContent,
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


// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

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

  const { data: topProducts } = useSWR(
    `/analytics/top-products?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Process data to truncate product names
  const processedData = React.useMemo(() => {
    if (!topProducts) return [];
    return topProducts.map((item: any) => ({
      ...item,
      productName: truncateText(item.productName || "", 20),
      originalName: item.productName, // Keep original for tooltip
    }));
  }, [topProducts]);

  const chartConfig = {
    totalOrdered: {
      label: t.labels?.totalOrdered || "Total Ordered",
      color: "var(--primary)",
    },
    label: { color: "var(--foreground)" },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
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
        <ChartContainer config={chartConfig} className="w-full h-[280px]">
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 5, bottom: 10 }}
            barCategoryGap="15%"
            barGap={4}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="productName"
              type="category"
              width={120}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs font-medium mb-1">
                        {data.originalName || data.productName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.labels?.totalOrdered || "Total Ordered"}:{" "}
                        {data.totalOrdered}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="totalOrdered"
              fill={chartConfig.totalOrdered.color}
              radius={[0, 3, 3, 0]}
            >
              <LabelList
                dataKey="totalOrdered"
                position="right"
                offset={6}
                fontSize={10}
                fill="var(--foreground)"
                fontWeight={500}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
