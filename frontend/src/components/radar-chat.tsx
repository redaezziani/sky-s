"use client";

import * as React from "react";
import useSWR from "swr";
import { TrendingUp } from "lucide-react";
import {
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { fetcher } from "@/lib/utils";

export function ChartTopProductsRadar() {
  const { locale } = useLocale();
  const t =
    getMessages(locale).pages.analytics.components.chartTopProductsRadar;

  const [timeRange, setTimeRange] = React.useState("30d");
  const [period, setPeriod] = React.useState(30);

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

  const processedData = React.useMemo(() => {
    if (!topProductsMetrics || topProductsMetrics.length === 0) return [];
    
    // Take top 2 products for stacked radial chart
    const topTwo = topProductsMetrics.slice(0, 2);
    return [{
      product1: topTwo[0]?.totalOrdered || 0,
      product2: topTwo[1]?.totalOrdered || 0,
      product1Name: topTwo[0]?.label || "Product 1",
      product2Name: topTwo[1]?.label || "Product 2",
    }];
  }, [topProductsMetrics]);

  const totalOrders = React.useMemo(() => {
    if (processedData.length === 0) return 0;
    return processedData[0].product1 + processedData[0].product2;
  }, [processedData]);

  const chartConfig = {
    product1: {
      label: processedData[0]?.product1Name || "Product 1",
      color: "var(--chart-1)",
    },
    product2: {
      label: processedData[0]?.product2Name || "Product 2",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{t.title}</CardTitle>
          <CardDescription className="text-sm">{t.description}</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            size="sm"
            className="hidden @[500px]/card:flex"
          >
            <ToggleGroupItem value="90d">{t.periods["90d"]}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{t.periods["30d"]}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{t.periods["7d"]}</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 h-8 @[500px]/card:hidden" size="sm">
              <SelectValue placeholder={t.selectPeriodPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">{t.periods["90d"]}</SelectItem>
              <SelectItem value="30d">{t.periods["30d"]}</SelectItem>
              <SelectItem value="7d">{t.periods["7d"]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={processedData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {totalOrders.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          {t.labels.totalOrdered || "Total Orders"}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="product1"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-product1)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="product2"
              fill="var(--color-product2)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          {t.periods[timeRange]} {t.labelSuffix}
        </div>
      </CardFooter>
    </Card>
  );
}
