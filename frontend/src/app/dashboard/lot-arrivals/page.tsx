"use client";

import { useState } from "react";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { LotArrivalsTable } from "@/components/lots/lot-arrivals-table";
import { LotArrivalsFilters } from "@/components/lots/lot-arrivals-filters";
import { ArrivalStatus } from "@/services/api/lots";

export default function LotArrivalsPage() {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [statusFilter, setStatusFilter] = useState<ArrivalStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.pages.lotArrivals.title}</h1>
          <p className="text-muted-foreground">{t.pages.lotArrivals.description}</p>
        </div>
      </div>

      <LotArrivalsFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <LotArrivalsTable
        statusFilter={statusFilter}
        startDate={startDate}
        endDate={endDate}
      />
    </section>
  );
}
