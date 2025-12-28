'use client';

import * as React from 'react';
import useSWR from 'swr';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { motion, PanInfo } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useTranslations } from 'next-intl';
import { fetcher } from '@/lib/utils';

interface CardType {
  growth: number;
  count: number;
}

// Hardcoded card keys
const CARD_KEYS = ['totalOrders', 'revenue', 'activeUsers', 'productsSold'];

export function SectionCards() {
  const [period, setPeriod] = React.useState(30);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const t = useTranslations('pages.analytics.components.sectionCards');

  const { data: apiData } = useSWR(
    `/analytics/cards?period=${period}`,
    fetcher,
    { refreshInterval: 60000 },
  );

  if (!apiData) return <div>Loading...</div>;

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Swiped right - go to previous card
      setCurrentIndex(
        (prev) => (prev - 1 + CARD_KEYS.length) % CARD_KEYS.length,
      );
    } else if (info.offset.x < -threshold) {
      // Swiped left - go to next card
      setCurrentIndex((prev) => (prev + 1) % CARD_KEYS.length);
    }
  };

  return (
    <div className="px-4  lg:px-6">
      {/* Mobile: Stacked cards */}
      <div className="relative md:h-70 h-40 md:hidden">
        {CARD_KEYS.map((key, index) => {
          const card: CardType = apiData[index];
          const TrendIcon =
            card.growth >= 0 ? IconTrendingUp : IconTrendingDown;
          const trendValue = `${
            card.growth >= 0 ? '+' : ''
          }${card.growth.toFixed(2)}%`;

          const offset = index - currentIndex;
          const absOffset = Math.abs(offset);

          return (
            <motion.div
              key={key}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              animate={{
                x: offset * 20,
                scale: 1 - absOffset * 0.05,
                rotateZ: offset * 2,
                opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.2,
                zIndex: CARD_KEYS.length - absOffset,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              style={{
                position: 'absolute',
                width: '100%',
                cursor: 'grab',
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>{t(`${key}.title`)}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {typeof card.count === 'number'
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
                  <div className="text-muted-foreground">
                    {t(`${key}.description`)}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tablet/Desktop: Grid layout */}
      <div className="hidden grid-cols-1 gap-4 md:grid @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {CARD_KEYS.map((key, index) => {
          const card: CardType = apiData[index];
          const TrendIcon =
            card.growth >= 0 ? IconTrendingUp : IconTrendingDown;
          const trendValue = `${
            card.growth >= 0 ? '+' : ''
          }${card.growth.toFixed(2)}%`;

          return (
            <Card key={key} className="@container/card">
              <CardHeader>
                <CardDescription>{t(`${key}.title`)}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {typeof card.count === 'number'
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
                <div className="text-muted-foreground">
                  {t(`${key}.description`)}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
