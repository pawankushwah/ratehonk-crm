import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";

export function ServiceProviderChart() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_week");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);


  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );
  const categories = useMemo(() => {
    const set = new Set<string>();

    invoices.forEach((inv) => {
      (inv.lineItems || []).forEach((li) => {
        if (li.travelCategory) set.add(li.travelCategory);
      });
    });

    return Array.from(set);
  }, [invoices]);

  const prepareProviderData = (list: any[]) => {
    if (!list || list.length === 0) return [];

    if (list.length <= 10) return list;

    const topTen = list.slice(0, 10);
    const otherList = list.slice(10);
    const otherValue = otherList.reduce((sum, item) => sum + item.value, 0);

    return [
      ...topTen,
      {
        name: "Other",
        value: Number(otherValue.toFixed(2)),
        color: "#D1D5DB",
      },
    ];
  };

  const providerData = useMemo(() => {
    if (!selectedCategory) return [];

    const countMap: Record<string, number> = {};

    invoices.forEach((inv) => {
      (inv.lineItems || []).forEach((li) => {
        if (li.travelCategory === selectedCategory && li.serviceProviderName) {
          countMap[li.serviceProviderName] =
            (countMap[li.serviceProviderName] || 0) + 1;
        }
      });
    });

    const total = Object.values(countMap).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const colors = [
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

    const sorted = Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const mapped = sorted.map((item, index) => ({
      name: item.name,
      value: Number(((item.count / total) * 100).toFixed(2)), // % value
      color: colors[index % colors.length],
    }));

    return prepareProviderData(mapped);
  }, [invoices, selectedCategory]);
 

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-md px-3 py-2 text-xs border border-gray-200">
          <p className="font-semibold">{item.name}</p>
          <p>{item.value}%</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
  if (categories.length > 0) {
    setSelectedCategory(categories[2]); 
  }
}, [categories]);


  return (
    <Card className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-xl p-4">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <CardTitle className="text-black font-medium text-lg">
            Service Providers
          </CardTitle>

       
            <div className="mb-5">
              <select
                className="border px-3 py-2 rounded-md text-sm w-full sm:w-60"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
          
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {providerData.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">
                No data available for the selected category.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Tooltip content={<CustomTooltip />} />

    <Pie
      data={providerData}
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
      onMouseEnter={(_, index) => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(null)}
    >
      {providerData.map((entry, idx) => (
        <Cell
          key={idx}
          fill={entry.color}
          style={{
            transition: "0.3s ease",
            transformOrigin: "center",
            cursor: "pointer",
            transform: activeIndex === idx ? "scale(1.08)" : "scale(1)",
            filter:
              activeIndex === idx
                ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                : "none",
          }}
        />
      ))}
    </Pie>
  </PieChart>
</ResponsiveContainer>

                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  {providerData.map((item, index) => (
                    <div className="flex items-center gap-2" key={index}>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}