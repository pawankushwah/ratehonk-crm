import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";

import { safeParseNumber } from "@/lib/utils";
import { useExpenses } from "@/hooks/useDashboardData";

const COLORS = ["#0A64A0", "#3E85C5", "#6DA9DB", "#8EC1E7", "#A7D5F0"];

export function ExpensePieChart() {
  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: expensesData = [], isLoading } = useExpenses(
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const approvedExpenses = expensesData.filter(
    (exp: any) => exp.status?.toLowerCase() === "approved"
  );

  const expenseAmountByCategory = approvedExpenses.reduce(
    (acc: any, exp: any) => {
      const cat = exp.category || "Other";
      const amt = safeParseNumber(exp?.amount);

      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += amt;
      return acc;
    },
    {}
  );

  const categoryArray = Object.entries(expenseAmountByCategory).map(
    ([category, amount]: any) => ({
      category,
      amount,
    })
  );

  const totalAmount = categoryArray.reduce((sum, x) => sum + x.amount, 0);

  const pieData = categoryArray.map((item, i) => ({
    name: item.category,
    value: Number(((item.amount / totalAmount) * 100).toFixed(1)),
    amount: item.amount,
    fill: COLORS[i % COLORS.length],
  }));

  const usingDummy = pieData.length === 0;



  const dummyGray = ["#C4C4C4", "#D3D3D3", "#E1E1E1"];
  const dummyHover = ["#0A64A0", "#3E85C5", "#6DA9DB"];

  const dummyData = [
    { name: "Category0", value: 10, amount: 0 },
    { name: "Category1", value: 20, amount: 0 },
    { name: "Category2", value: 30, amount: 0 },
  ];

  const displayData = usingDummy
    ? dummyData.map((d, i) => ({
        ...d,
        fill:
          activeIndex === i
            ? dummyHover[i % dummyHover.length]
            : dummyGray[i % dummyGray.length],
      }))
    : pieData;


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-md p-2 border text-xs text-black">
          <p className="font-semibold">{item.name}</p>
          <p>{item.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-6 bg-white shadow-xl rounded-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 p-4">
        <div>
          <CardTitle className="text-[#000000] font-medium text-base sm:text-lg">
            Expense by Category
          </CardTitle>

          <p className="text-xl sm:text-2xl font-semibold text-[#000000] mt-1">
            C$ {(totalAmount / 1000).toFixed(1)}k
          </p>
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

          <Button variant="outline" className="border rounded-lg p-2">
            <Download size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex justify-center items-center">
          <div className="relative w-36 h-36 sm:w-52 sm:h-52 mb-10">
            <ResponsiveContainer width="100%" height="100%">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500 animate-pulse text-sm">
                    Loading expenses...
                  </p>
                </div>
              ) : (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />

                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {displayData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        style={{
                          transition: "0.3s",
                          transform:
                            activeIndex === index ? "scale(1.1)" : "scale(1)",
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
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {displayData.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 pt-4 text-xs sm:text-sm text-gray-700">
            {displayData.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1 border-b min-w-[120px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></span>

                  {usingDummy ? item.name : item.name}
                </div>

                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
