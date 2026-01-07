"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface LotsFiltersProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function LotsFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: LotsFiltersProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  const handleClearFilters = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Start Date Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t.pages.lots.filters.from}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "PPP")
                ) : (
                  <span>{t.pages.lots.filters.pickDate}</span>
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
          <span className="text-sm font-medium">{t.pages.lots.filters.to}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>{t.pages.lots.filters.pickDate}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                disabled={(date) =>
                  startDate ? date < startDate : false
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters */}
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="w-fit"
          >
            <X className="mr-2 h-4 w-4" />
            {t.pages.lots.filters.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
