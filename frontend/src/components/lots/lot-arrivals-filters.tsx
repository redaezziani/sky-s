"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { ArrivalStatus } from "@/services/api/lots";

interface LotArrivalsFiltersProps {
  statusFilter: ArrivalStatus | "ALL";
  onStatusFilterChange: (status: ArrivalStatus | "ALL") => void;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function LotArrivalsFilters({
  statusFilter,
  onStatusFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: LotArrivalsFiltersProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  const handleClearFilters = () => {
    onStatusFilterChange("ALL");
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {t.pages.lotArrivals.filterByStatus}:
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as ArrivalStatus | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t.pages.lotArrivals.allStatuses}
              </SelectItem>
              <SelectItem value={ArrivalStatus.PENDING}>
                {t.pages.lotArrivals.status.pending}
              </SelectItem>
              <SelectItem value={ArrivalStatus.VERIFIED}>
                {t.pages.lotArrivals.status.verified}
              </SelectItem>
              <SelectItem value={ArrivalStatus.DAMAGED}>
                {t.pages.lotArrivals.status.damaged}
              </SelectItem>
              <SelectItem value={ArrivalStatus.INCOMPLETE}>
                {t.pages.lotArrivals.status.incomplete}
              </SelectItem>
              <SelectItem value={ArrivalStatus.EXCESS}>
                {t.pages.lotArrivals.status.excess}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t.pages.lotArrivals.filters.from}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "PPP")
                ) : (
                  <span>{t.pages.lotArrivals.filters.pickDate}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t.pages.lotArrivals.filters.to}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>{t.pages.lotArrivals.filters.pickDate}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                disabled={(date) => (startDate ? date < startDate : false)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters */}
        {(statusFilter !== "ALL" || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="w-fit"
          >
            <X className="mr-2 h-4 w-4" />
            {t.pages.lotArrivals.filters.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
