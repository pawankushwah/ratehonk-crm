import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export interface DateFilters {
  startDate: string;
  endDate: string;
  filterType: string;
}

export function getDateRange(filterType: string): { start: Date; end: Date } {
  const now = new Date();
  
  switch (filterType) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
    case "this_week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(now, { weekStartsOn: 1 })
      };
    case "this_month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case "this_year":
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
  }
}

export function buildDateFilters(
  dateFilter: string,
  customDateFrom: Date | null,
  customDateTo: Date | null
): DateFilters | undefined {
  if (dateFilter === "all") return undefined;
  
  if (dateFilter === "custom" && customDateFrom && customDateTo) {
    return {
      startDate: customDateFrom.toISOString().split('T')[0],
      endDate: customDateTo.toISOString().split('T')[0],
      filterType: dateFilter
    };
  }
  
  if (dateFilter !== "custom") {
    const dateRange = getDateRange(dateFilter);
    return {
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
      filterType: dateFilter
    };
  }
  
  return undefined;
}