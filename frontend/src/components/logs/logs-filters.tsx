"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LogsQuery, LogType, LogAction, logsApi } from "@/services/api/logs";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface LogsFiltersProps {
  filters: LogsQuery;
  onFilterChange: (filters: Partial<LogsQuery>) => void;
}

export function LogsFilters({ filters, onFilterChange }: LogsFiltersProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    filters.date ? new Date(filters.date) : undefined
  );

  useEffect(() => {
    // Fetch available dates
    logsApi.getAvailableDates(filters.type).then((dates) => {
      setAvailableDates(dates.map((d) => new Date(d)));
    });
  }, [filters.type]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onFilterChange({
      date: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const handleClearFilters = () => {
    setSelectedDate(undefined);
    onFilterChange({
      search: undefined,
      date: undefined,
      action: undefined,
      entity: undefined,
      userId: undefined,
      entityId: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <Input
          placeholder={t.pages.logs.filters.searchPlaceholder}
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="col-span-1"
        />

        {/* Log Type */}
        <Select
          value={filters.type || LogType.ACTIVITY}
          onValueChange={(value) => onFilterChange({ type: value as LogType })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.pages.logs.filters.selectType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LogType.ACTIVITY}>
              {t.pages.logs.logTypes.activity}
            </SelectItem>
            <SelectItem value={LogType.ERROR}>
              {t.pages.logs.logTypes.error}
            </SelectItem>
            <SelectItem value={LogType.COMBINED}>
              {t.pages.logs.logTypes.combined}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Action Filter */}
        <Select
          value={filters.action || "all"}
          onValueChange={(value) =>
            onFilterChange({ action: value === "all" ? undefined : (value as LogAction) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t.pages.logs.filters.selectAction} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.pages.logs.filters.allActions}</SelectItem>
            {Object.values(LogAction).map((action) => (
              <SelectItem key={action} value={action}>
                {t.pages.logs.actions[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>{t.pages.logs.filters.selectDate}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) =>
                !availableDates.some(
                  (d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                )
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear Filters */}
      {(filters.search || filters.date || filters.action || filters.entity) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="w-fit"
        >
          <X className="mr-2 h-4 w-4" />
          {t.pages.logs.filters.clearFilters}
        </Button>
      )}
    </div>
  );
}
