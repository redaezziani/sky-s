"use client";

import * as React from "react";
import useSWR from "swr";
import { TrendingUp } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    `http://localhost:8085/api/analytics/top-products-metrics?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const processedData = React.useMemo(() => {
    if (!topProductsMetrics) return [];
    return topProductsMetrics.map((item: any) => ({
      label:
        item.label.length > 20 ? item.label.slice(0, 20) + "..." : item.label,
      totalOrdered: item.totalOrdered,
      totalRevenue: item.totalRevenue,
      fullLabel: item.label,
    }));
  }, [topProductsMetrics]);

  const chartConfig = {
    totalOrdered: {
      label: t.labels.totalOrdered || "Total Ordered",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
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

      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={processedData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <Radar
              name={chartConfig.totalOrdered.label}
              dataKey="totalOrdered"
              fill={chartConfig.totalOrdered.color}
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          </RadarChart>
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
