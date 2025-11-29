import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";

export function ConsolidatedVendorBookingChart() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_week");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

 
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      "#F66D44",
      "#219653",
      "#BB6BD9",
      "#F2C94C",
      "#56CCF2",
      "#9B51E0",
      "#27AE60",
      "#EB5757",
      "#F2994A",
    ];

    return Object.keys(countMap).map((vendor, idx) => ({
      name: vendor,
      percentage: Number(((countMap[vendor] / total) * 100).toFixed(2)),
      color: colorPalette[idx % colorPalette.length],
    }));
  }, [invoices]);

  const finalVendorData = vendorData.length > 0 ? vendorData : dummyVendorData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-md p-2 border text-xs text-black">
          <p className="font-semibold">{item.name}</p>
          <p>{item.percentage}%</p>
        </div>
      );
    }
    return null;
  };
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
            <div className="relative w-full h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={finalVendorData}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={0}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {finalVendorData.map((entry, index) => (
                      <Cell
                        key={`inner-${index}`}
                        fill={entry.color}
                        style={{
                          transition: "0.3s",
                          transform:
                            activeIndex === index ? "scale(1.08)" : "scale(1)",
                          filter:
                            activeIndex === index
                              ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                              : "none",
                          transformOrigin: "center",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={finalVendorData}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={1}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {finalVendorData.map((entry, index) => (
                      <Cell
                        key={`outer-${index}`}
                        fill={entry.color}
                        style={{
                          transition: "0.3s",
                          transform:
                            activeIndex === index ? "scale(1.08)" : "scale(1)",
                          filter:
                            activeIndex === index
                              ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                              : "none",
                          transformOrigin: "center",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Pie>
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
                    <p className="text-gray-500 text-[11px]">
                      {v.percentage}%
                    </p>
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