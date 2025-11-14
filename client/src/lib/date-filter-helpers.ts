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

// Helper function to format date in local timezone (YYYY-MM-DD)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDateFilters(
  dateFilter: string,
  customDateFrom: Date | null,
  customDateTo: Date | null
): DateFilters | undefined {
  if (dateFilter === "all") return undefined;
  
  if (dateFilter === "custom" && customDateFrom && customDateTo) {
    return {
      startDate: formatLocalDate(customDateFrom),
      endDate: formatLocalDate(customDateTo),
      filterType: dateFilter
    };
  }
  
  if (dateFilter !== "custom") {
    const dateRange = getDateRange(dateFilter);
    return {
      startDate: formatLocalDate(dateRange.start),
      endDate: formatLocalDate(dateRange.end),
      filterType: dateFilter
    };
  }
  
  return undefined;
}