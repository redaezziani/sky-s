'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import useSWR from 'swr';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';
import { fetcher } from '@/lib/utils';

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.analytics?.components?.chartAreaInteractive || {};

  const [timeRange, setTimeRange] = React.useState('90d');
  const [period, setPeriod] = React.useState(90);

  const isRTL = locale === 'ar';

  React.useEffect(() => {
    if (timeRange === '90d') setPeriod(90);
    else if (timeRange === '30d') setPeriod(30);
    else setPeriod(7);
  }, [timeRange]);

  const { data: chartData } = useSWR(
    `/analytics/chart?period=${period}`,
    fetcher,
    { refreshInterval: 60000 },
  );

  const chartConfig = {
    orders: {
      label: t.chartLabels?.orders || 'Orders',
      color: 'var(--chart-1)',
    },
    revenue: {
      label: t.chartLabels?.revenue || 'Revenue',
      color: 'var(--chart-1)',
    },
    products: {
      label: t.chartLabels?.products || 'Products',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  // Formatter that ensures Arabic script renders as a single directional block
  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });

    // \u200f is the Right-to-Left Mark (RLM) to ensure punctuation/numbers align
    return isRTL ? `\u200f${date}` : date;
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t.title || 'Analytics'}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t.description?.desktop || 'Total for the selected period'}
          </span>
          <span className="@[540px]/card:hidden">
            {t.description?.mobile || 'Selected period'}
          </span>
        </CardDescription>

        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">
              {t.periods?.['90d'] || 'Last 3 months'}
            </ToggleGroupItem>
            <ToggleGroupItem value="30d">
              {t.periods?.['30d'] || 'Last 30 days'}
            </ToggleGroupItem>
            <ToggleGroupItem value="7d">
              {t.periods?.['7d'] || 'Last 7 days'}
            </ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-40 @[767px]/card:hidden" size="sm">
              <SelectValue
                placeholder={t.selectPeriodPlaceholder || 'Select period'}
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">
                {t.periods?.['90d'] || 'Last 3 months'}
              </SelectItem>
              <SelectItem value="30d">
                {t.periods?.['30d'] || 'Last 30 days'}
              </SelectItem>
              <SelectItem value="7d">
                {t.periods?.['7d'] || 'Last 7 days'}
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
          {/* We keep the container LTR because Recharts handles coordinates in LTR, 
              but we use the 'reversed' prop on XAxis to flip the data flow visually */}
          <AreaChart data={chartData || []} margin={{ left: 12, right: 12 }}>
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
              tickFormatter={formatDate}
              // reversed={isRTL}
              tick={{
                fill: 'hsl(var(--foreground))',
                fontSize: 12,
                style: { direction: 'rtl', unicodeBidi: 'plaintext' },
              }}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={formatDate}
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
