import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";

// Helper function to parse date string to Date object in local timezone
function parseDateString(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  // If it's already a Date object, return it
  if (dateStr instanceof Date) return dateStr;
  // Parse YYYY-MM-DD format in local timezone
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  // Fallback to Date constructor
  return new Date(dateStr);
}

interface DateFilterProps {
  dateFilter: string;
  setDateFilter: (value: string) => void;
  customDateFrom: Date | null;
  setCustomDateFrom: (date: Date | null) => void;
  customDateTo: Date | null;
  setCustomDateTo: (date: Date | null) => void;
  className?: string;
}

export function DateFilter({
  dateFilter,
  setDateFilter,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  className = ""
}: DateFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-date-range">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this_week">This week</SelectItem>
          <SelectItem value="this_month">This month</SelectItem>
          <SelectItem value="this_year">This year</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {dateFilter === "custom" && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "w-[130px] h-9 justify-start text-left font-normal text-xs", 
                  !customDateFrom && "text-muted-foreground"
                )} 
                data-testid="button-date-from"
              >
                <CalendarDays className="mr-1 h-3 w-3" />
                {customDateFrom ? format(customDateFrom, "MMM dd, y") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePickerCalendar 
                mode="single" 
                selected={customDateFrom ?? undefined} 
                onSelect={(d) => {
                  if (d) {
                    // Create a new date in local timezone to avoid timezone conversion
                    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    setCustomDateFrom(localDate);
                    setDateFilter("custom");
                  } else {
                    setCustomDateFrom(null);
                  }
                }} 
                initialFocus 
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "w-[130px] h-9 justify-start text-left font-normal text-xs", 
                  !customDateTo && "text-muted-foreground"
                )} 
                data-testid="button-date-to"
              >
                <CalendarDays className="mr-1 h-3 w-3" />
                {customDateTo ? format(customDateTo, "MMM dd, y") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePickerCalendar 
                mode="single" 
                selected={customDateTo ?? undefined} 
                onSelect={(d) => {
                  if (d) {
                    // Create a new date in local timezone to avoid timezone conversion
                    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    setCustomDateTo(localDate);
                    setDateFilter("custom");
                  } else {
                    setCustomDateTo(null);
                  }
                }} 
                initialFocus 
              />
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}