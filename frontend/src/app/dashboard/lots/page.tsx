'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnhancedLotsTable } from '@/components/lots/enhanced-lots-table';
import { LotsFilters } from '@/components/lots/lots-filters';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';

export default function LotsPage() {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [initialSearch, setInitialSearch] = useState<string>('');

  useEffect(() => {
    const detailId = searchParams.get('detailId');
    if (detailId) {
      setInitialSearch(detailId);
    }
  }, [searchParams]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.pages.lots.title}</h1>
          <p className="text-muted-foreground">{t.pages.lots.description}</p>
        </div>
      </div>

      <LotsFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <EnhancedLotsTable
        startDate={startDate}
        endDate={endDate}
        initialSearch={initialSearch}
      />
    </section>
  );
}
