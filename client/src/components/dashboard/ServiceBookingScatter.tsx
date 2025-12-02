import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";

const COLORS = ["#3B82F6"];

export function ServiceBookingScatter() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_month");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const bubbleData = useMemo(() => {
    const serviceCountMap: Record<string, number> = {};

    invoices.forEach((invoice: any) => {
      if (!invoice.lineItems || !Array.isArray(invoice.lineItems)) return;

      invoice.lineItems.forEach((li: any) => {
        const service =
          li.travelCategory?.trim() ||
          li.itemTitle?.trim() ||
          li.description?.trim() ||
          "Other Service";

        if (service) {
          serviceCountMap[service] = (serviceCountMap[service] || 0) + 1;
        }
      });
    });

    const total = Object.values(serviceCountMap).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(serviceCountMap)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 12) + "..." : name,
        fullName: name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [invoices]);

  const positionedData = useMemo(() => {
    return bubbleData.map((item, index) => {
      const angle = (index / bubbleData.length) * 2 * Math.PI - Math.PI / 2;
      const distance = 25 + (bubbleData.length - index) * 8;

      const x = 50 + Math.cos(angle) * distance;
      const y = 50 + Math.sin(angle) * distance * 0.7;

      const size = 60 + item.percentage * 2.2;

      return {
        ...item,
        x: Math.max(15, Math.min(85, x)),
        y: Math.max(20, Math.min(80, y)),
        size,
        color: COLORS[index % COLORS.length],
      };
    });
  }, [bubbleData]);

  return (
    <Card className="col-span-6 bg-white shadow-xl rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Service Bookings
            </CardTitle>
            <CardDescription className="mt-1">
              Most booked services • {dateFilter.replace("_", " ")}
            </CardDescription>
          </div>

          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDateFrom={customDateFrom}
            setCustomDateFrom={setCustomDateFrom}
            customDateTo={customDateTo}
            setCustomDateTo={setCustomDateTo}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-300 rounded-full blur-3xl" />
          </div>

          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 animate-pulse">Loading services...</p>
            </div>
          ) : bubbleData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-gray-200 border-2 border-dashed rounded-xl mb-4" />
              <p className="text-gray-500 font-medium">No bookings found</p>
              <p className="text-sm text-gray-400 mt-2">
                Try selecting a different date range
              </p>
            </div>
          ) : (
            <>
              {positionedData.map((item, index) => {
                const isActive = activeIndex === index;

                return (
                  <div
                    key={item.fullName}
                    className="absolute flex flex-col items-center justify-center text-white font-bold rounded-full cursor-pointer"
                    style={{
                      width: item.size,
                      height: item.size,
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      backgroundColor: item.color,

                      transform: `translate(-50%, -50%) scale(${isActive ? 1.1 : 1})`,
                      transition: "transform 0.3s ease, filter 0.3s ease",

                      filter: isActive
                        ? "drop-shadow(0px 0px 8px rgba(0,0,0,0.35))"
                        : "none",

                      zIndex: isActive ? 20 : 1,
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <div className="text-center leading-tight z-10 px-1">
                      <div className="text-2xl">{item.percentage}%</div>
                      <div className="text-xs mt-1 opacity-90">{item.name}</div>
                    </div>

                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{
                        backgroundColor: item.color,
                        animationDelay: `${index * 0.2}s`,
                      }}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
