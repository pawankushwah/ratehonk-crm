import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export interface DateFilters {
  startDate: string;
  endDate: string;
  filterType: string;
}

export function getDateRange(filterType: string): { start: Date; end: Date } {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  switch (filterType) {
    case "today":
      return {
        start: startOfDay(utcNow),
        end: endOfDay(utcNow)
      };
    case "this_week":
      return {
        start: startOfWeek(utcNow, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(utcNow, { weekStartsOn: 1 })
      };
    case "this_month":
      return {
        start: startOfMonth(utcNow),
        end: endOfMonth(utcNow)
      };
    case "this_year":
      return {
        start: startOfYear(utcNow),
        end: endOfYear(utcNow)
      };
    case "this_quarter": {
      const year = utcNow.getUTCFullYear();
      const month = utcNow.getUTCMonth();
      const quarter = Math.floor(month / 3);
      const qStartMonth = quarter * 3;
      const qEndMonth = qStartMonth + 2;
      
      return {
        start: new Date(Date.UTC(year, qStartMonth, 1)),
        end: new Date(Date.UTC(year, qEndMonth + 1, 0))
      };
    }
    default:
      return {
        start: startOfDay(utcNow),
        end: endOfDay(utcNow)
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
