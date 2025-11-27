import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";

export function ServiceProviderChart() {
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


  const dummyProviderData = [
    { name: "Air India", value: 40, color: "#6C63FF" },
    { name: "Indigo", value: 32, color: "#A393FF" },
    { name: "Vistara", value: 28, color: "#D7D2FF" },
  ];


  const providerData = useMemo(() => {
    const countMap: Record<string, number> = {};

    invoices.forEach((inv) => {
      (inv.lineItems || []).forEach((li) => {
        if (!li.serviceProviderName) return;

        countMap[li.serviceProviderName] =
          (countMap[li.serviceProviderName] || 0) + 1;
      });
    });

    const total = Object.values(countMap).reduce((a, b) => a + b, 0);

    if (total === 0) return [];

    const pastelColors = [
      "#6C63FF",
      "#A393FF",
      "#D7D2FF",
      "#9A8CFF",
      "#C8C2FF",
      "#8A84FF",
      "#A29CFF",
      "#C5C2FF",
      "#E4E1FF",
      "#7D74FF",
      "#998FFF",
      "#B9B2FF",
    ];

    return Object.keys(countMap).map((name, index) => ({
      name,
      value: Number(((countMap[name] / total) * 100).toFixed(2)),
      color: pastelColors[index % pastelColors.length],
    }));
  }, [invoices]);


  const finalProviderData =
    providerData.length > 0 ? providerData : dummyProviderData;

  return (
    <Card className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-xl p-4">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <CardTitle className="text-black font-medium text-lg">
            Service Provider
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
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalProviderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={450}
                    stroke="none"
                  >
                    {finalProviderData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
              {finalProviderData.map((item, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>

                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-500 text-[12px]">{item.value}%</p>
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
