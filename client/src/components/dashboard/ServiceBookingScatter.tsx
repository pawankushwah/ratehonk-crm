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

const REAL_COLOR = "#3B82F6";
const DUMMY_GRAY = ["#D1D5DB", "#C7C7C7", "#BEBEBE"];
const DUMMY_HOVER = ["#3B82F6", "#2563EB", "#1D4ED8"];

export function ServiceBookingScatter() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_quarter");
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
      invoice?.lineItems?.forEach((li: any) => {
        const service =
          li.travelCategory ||
          li.itemTitle ||
          li.description ||
          "Other Service";

        serviceCountMap[service] = (serviceCountMap[service] || 0) + 1;
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
      .slice(0, 12);
  }, [invoices]);


  const usingDummy = bubbleData.length === 0;

  const dummyBubbleData = [
    { name: "Category 0", percentage: 40 },
    { name: "Category 1", percentage: 35 },
    { name: "Category 2", percentage: 25 },
  ];

  const usedData = usingDummy ? dummyBubbleData : bubbleData;


  const positionedData = useMemo(() => {
    const radiusStep = 18;
    const angleStep = (Math.PI * 2) / usedData.length;

    return usedData.map((item, index) => {
      const angle = index * angleStep;
      const radius = 18 + index * radiusStep * 0.5;

      const x = 55 + Math.cos(angle) * radius;
      const y = 55 + Math.sin(angle) * (radius * 0.95);

      const size = usingDummy
        ? 70 + item.percentage * 0.5
        : 80 + item.percentage * 0.6;

      const color = usingDummy
        ? activeIndex === index
          ? DUMMY_HOVER[index % DUMMY_HOVER.length]
          : DUMMY_GRAY[index % DUMMY_GRAY.length]
        : REAL_COLOR;

      return {
        ...item,
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(12, Math.min(85, y)),
        size,
        color,
      };
    });
  }, [usedData, activeIndex, usingDummy]);

  
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

          <div className="flex gap-2">
            <DateFilter
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customDateFrom={customDateFrom}
              setCustomDateFrom={setCustomDateFrom}
              customDateTo={customDateTo}
              setCustomDateTo={setCustomDateTo}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden">

          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 animate-pulse">Loading services...</p>
            </div>
          ) : usedData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No data</p>
            </div>
          ) : (
            positionedData.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  key={item.name}
                  className="absolute flex flex-col items-center justify-center text-white rounded-full cursor-pointer transition-all"
                  style={{
                    width: item.size,
                    height: item.size,
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `translate(-50%, -50%) scale(${isActive ? 1.12 : 1})`,
                    backgroundColor: item.color,
                    boxShadow: isActive
                      ? "0px 0px 12px rgba(0,0,0,0.35)"
                      : "none",
                    transition: "all 0.35s ease",
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="text-center px-2">
                    <div className="text-xl font-semibold">
                      {item.percentage}%
                    </div>
                    <div className="text-xs opacity-90">{item.name}</div>
                  </div>

                  
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{
                      backgroundColor: item.color,
                      animationDelay: `${index * 0.3}s`,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
