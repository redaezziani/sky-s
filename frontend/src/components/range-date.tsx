"use client";

import { useState, useEffect } from "react";
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  format,
} from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar1, CalendarIcon } from "lucide-react";

interface RangeDateProps {
  onDateChange?: (dateRange: DateRange | undefined) => void;
  initialDate?: DateRange;
}

export default function RangeDate({
  onDateChange,
  initialDate,
}: RangeDateProps) {
  const today = new Date();
  const yesterday = { from: subDays(today, 1), to: subDays(today, 1) };
  const last7Days = { from: subDays(today, 6), to: today };
  const last30Days = { from: subDays(today, 29), to: today };
  const monthToDate = { from: startOfMonth(today), to: today };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = { from: startOfYear(today), to: today };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };

  const [month, setMonth] = useState(today);
  const [date, setDate] = useState<DateRange | undefined>(
    initialDate || last7Days
  );

  // notify parent
  useEffect(() => {
    onDateChange?.(date);
  }, [date, onDateChange]);

  const handleDatePreset = (newDate: DateRange, presetMonth: Date) => {
    setDate(newDate);
    setMonth(presetMonth);
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className=" justify-start text-left font-normal"
          >
            <Calendar1 className="mr-2 h-4 w-4" />
            {date?.from && date?.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex max-sm:flex-col">
            <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
              <div className="h-full sm:border-e">
                <div className="flex flex-col px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      handleDatePreset({ from: today, to: today }, today)
                    }
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(yesterday, yesterday.to)}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(last7Days, last7Days.to)}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(last30Days, last30Days.to)}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      handleDatePreset(monthToDate, monthToDate.to)
                    }
                  >
                    Month to date
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(lastMonth, lastMonth.to)}
                  >
                    Last month
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(yearToDate, yearToDate.to)}
                  >
                    Year to date
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDatePreset(lastYear, lastYear.to)}
                  >
                    Last year
                  </Button>
                </div>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              month={month}
              onMonthChange={setMonth}
              className="p-2"
              disabled={[{ after: today }]}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
