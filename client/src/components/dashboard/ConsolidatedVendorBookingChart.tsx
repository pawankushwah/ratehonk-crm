import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";

export function ConsolidatedVendorBookingChart() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("thisMonth");
  const [customDateFrom, setCustomDateFrom] = useState(null);
  const [customDateTo, setCustomDateTo] = useState(null);

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  
  const dummyVendorData = [
    { name: "Voyzant", percentage: 45, color: "#2F80ED" },
    { name: "Air India", percentage: 30, color: "#F2994A" },
    { name: "Indigo", percentage: 25, color: "#EB5757" },
  ];

  
  const vendorData = useMemo(() => {
    const countMap: Record<string, number> = {};

    invoices.forEach((inv) => {
      (inv.lineItems || []).forEach((li) => {
        if (!li.vendorName) return;

        countMap[li.vendorName] =
          (countMap[li.vendorName] || 0) + 1;
      });
    });

    const total = Object.values(countMap).reduce((a, b) => a + b, 0);
    if (total === 0) return []; 

    const colorPalette = [
      "#2F80ED",
      "#F2994A",
      "#EB5757",
      "#27AE60",
      "#9B51E0",
      "#56CCF2",
      "#F2C94C",
      "#BB6BD9",
      "#219653",
      "#F66D44",
    ];

    return Object.keys(countMap).map((vendor, idx) => ({
      name: vendor,
      percentage: Number(((countMap[vendor] / total) * 100).toFixed(2)),
      color: colorPalette[idx % colorPalette.length],
    }));
  }, [invoices]);


  const finalVendorData = vendorData.length > 0 ? vendorData : dummyVendorData;

  
  const getRingData = (percentage: number, color: string) => [
    { value: percentage, color },
    { value: 100 - percentage, color: "#E5E7EB" },
  ];

 
  const baseOuterRadius = 120;
  const ringThickness = 25;
  const ringGap = 6;

  return (
    <Card className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-xl p-4">
      <CardHeader className="pb-4">
        <div className="flex flex-col text-black sm:flex-row items-center justify-between gap-3">
          <CardTitle className="text-black font-medium text-lg">
            Consolidated Booking
          </CardTitle>

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
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>

        ) : finalVendorData.length === 0 ? (
          <p className="text-center text-gray-500">No vendor data</p>

        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

           
            <div className="relative w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {finalVendorData.map((vendor, idx) => {
                    const outerRadius =
                      baseOuterRadius - idx * (ringThickness + ringGap);
                    const innerRadius = outerRadius - ringThickness;

                    return (
                      <Pie
                        key={idx}
                        data={getRingData(vendor.percentage, vendor.color)}
                        dataKey="value"
                        cx="50%"
                        cy="75%"
                        startAngle={200}
                        endAngle={-20}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        stroke="none"
                      >
                        {getRingData(vendor.percentage, vendor.color).map(
                          (seg, segIndex) => (
                            <Cell key={segIndex} fill={seg.color} />
                          )
                        )}
                      </Pie>
                    );
                  })}
                </PieChart>
              </ResponsiveContainer>
            </div>

           
            <div className="space-y-3 text-xs">
              {finalVendorData.map((v, idx) => (
                <div className="flex items-center gap-2" key={idx}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: v.color }}
                  ></div>

                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-gray-500 text-[11px]">{v.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
