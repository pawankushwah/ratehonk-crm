import { useState } from "react";
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

export function ServiceBookingScatter() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_month");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const {
    data: invoiceGraphData = [],
    isLoading,
  } = useInvoicesForGraph(tenant?.id, dateFilter, customDateFrom, customDateTo);

  console.log("🚀 ~ invoiceGraphData:", invoiceGraphData);

  
  const serviceCountMap: Record<string, number> = {};

  invoiceGraphData.forEach((invoice: any) => {
    if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
      invoice.lineItems.forEach((li: any) => {
        const service =
          li.travelCategory?.trim() ||
          li.itemTitle?.trim() ||
          "Unknown Service";

        serviceCountMap[service] = (serviceCountMap[service] || 0) + 1;
      });
    }
  });

  console.log("🚀 ~ serviceCountMap:", serviceCountMap);

  const total = Object.values(serviceCountMap).reduce((a, b) => a + b, 0);


  const dummyData = [
    { name: "Flight", count: 19, percentage: 79 },
    { name: "Hotel", count: 2, percentage: 8 },
    { name: "Event Booking", count: 1, percentage: 4 },
    { name: "Package", count: 1, percentage: 4 },
    { name: "Activities", count: 1, percentage: 4 },
  ];

 
  const bubbleData = Object.entries(serviceCountMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .filter((b) => b.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  console.log("🚀 ~ bubbleData:", bubbleData);

 
  const finalBubbleData = bubbleData.length > 0 ? bubbleData : dummyData;

  
  const getBubblePosition = (index: number) => {
    if (index === 0) return { x: 68, y: 50 };
    if (index === 1) return { x: 32, y: 30 };
    if (index === 2) return { x: 35, y: 70 };
    if (index === 3) return { x: 15, y: 50 };

    
    return { x: 25 + index * 6, y: 40 + index * 5 };
  };

  return (
    <Card className="col-span-6 bg-white shadow-xl rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Bookings</CardTitle>
            <CardDescription>
              Based on invoice service categories
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

      <CardContent>
        <div className="relative w-full h-[360px] flex justify-center items-center">
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            finalBubbleData.map((item, index) => {
              const size = 60 + item.percentage * 1.2;
              const pos = getBubblePosition(index);

              return (
                <div
                  key={index}
                  className="absolute flex flex-col justify-center items-center text-white font-semibold rounded-full shadow-xl transition-all duration-500"
                  style={{
                    width: size,
                    height: size,
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "#3B82F6",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full border-[5px] border-white opacity-70"
                    style={{ transform: "scale(1.12)" }}
                  ></div>

                  <span className="text-lg">{item.percentage}%</span>
                  <span className="text-xs opacity-90 mt-1">{item.name}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
