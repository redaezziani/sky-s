"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import useSWR from "swr";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
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

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { locale } = useLocale();
  const t = getMessages(locale).pages.analytics.components.chartAreaInteractive;

  const [timeRange, setTimeRange] = React.useState("90d");
  const [period, setPeriod] = React.useState(90);

  // Update period based on selected range
  React.useEffect(() => {
    if (timeRange === "90d") setPeriod(90);
    else if (timeRange === "30d") setPeriod(30);
    else setPeriod(7);
  }, [timeRange]);

  // Fetch chart data
  const { data: chartData } = useSWR(
    `/analytics/chart?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Chart config
  const chartConfig = {
    orders: { label: t.chartLabels.orders, color: "var(--primary)" },
    revenue: { label: t.chartLabels.revenue, color: "#ff3fe1" },
    products: { label: t.chartLabels.products, color: "var(--primary)" },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t.description.desktop}
          </span>
          <span className="@[540px]/card:hidden">{t.description.mobile}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">{t.periods["90d"]}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{t.periods["30d"]}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{t.periods["7d"]}</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder={t.selectPeriodPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t.periods["90d"]}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t.periods["30d"]}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t.periods["7d"]}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData || []}>
            <defs>
              {Object.keys(chartConfig).map((key) => (
                <linearGradient
                  key={key}
                  id={`fill${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={
                      chartConfig[key as keyof typeof chartConfig].color
                    }
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      chartConfig[key as keyof typeof chartConfig].color
                    }
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(t.tooltipLocale, {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(t.tooltipLocale, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            {Object.keys(chartConfig).map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill${key})`}
                stroke={chartConfig[key as keyof typeof chartConfig].color}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
