"use client";

import * as React from "react";
import useSWR from "swr";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { fetcher } from "@/lib/utils";

// Hardcoded card keys
const CARD_KEYS = ["totalOrders", "revenue", "activeUsers", "productsSold"];

export function SectionCards() {
  const [period, setPeriod] = React.useState(30);

  const { locale } = useLocale();
  const t = getMessages(locale).pages.analytics.components.sectionCards;

  const { data: apiData } = useSWR(
    `/analytics/cards?period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (!apiData) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {CARD_KEYS.map((key, index) => {
        const card = apiData[index];
        const TrendIcon = card.growth >= 0 ? IconTrendingUp : IconTrendingDown;
        const trendValue = `${card.growth >= 0 ? "+" : ""}${card.growth}%`;

        return (
          <Card key={key} className="@container/card">
            <CardHeader>
              <CardDescription>{t[key].title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {typeof card.count === "number"
                  ? card.count.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : card.count}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon />
                  {trendValue}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-muted-foreground">{t[key].description}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
