import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/ui/date-filter";
import { ProfitLossList } from "./ProfitLossList";
import { useProfitLossData } from "@/hooks/useDashboardData";


const dummyProfitLoss = [
  { month: "2024-12", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-01", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-02", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-03", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-04", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-05", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-06", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-07", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-08", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-09", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-10", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-11", expenses: 0, revenue: 0, profit: 0 },
  { month: "2025-12", expenses: 0, revenue: 0, profit: 0 },
];

export function ProfitLossCard() {
  const [profitPage, setProfitPage] = useState(0);

  const [dateFilter, setDateFilter] = useState("this_year");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

 
  const { data: profitLossData, isLoading } = useProfitLossData(
    dateFilter,
    customDateFrom,
    customDateTo
  );


  const monthlyData = profitLossData?.monthly || [];

  const isDataEmpty =
    monthlyData.length === 0 ||
    monthlyData.every(
      (m) =>
        (m.expenses ?? 0) === 0 &&
        (m.revenue ?? 0) === 0 &&
        (m.profit ?? 0) === 0
    );

  const finalProfitLoss = isDataEmpty ? dummyProfitLoss : monthlyData;

  return (
    <Card className="lg:col-span-5">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-[#000000] text-base sm:text-lg font-semibold">
          Profit & Loss
        </CardTitle>

        <DateFilter
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
        />
      </CardHeader>

      <CardContent className="min-h-[320px]">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm py-8">
            Loading...
          </div>
        ) : (
          <ProfitLossList
            profitLossData={finalProfitLoss}
            profitPage={profitPage}
            setProfitPage={setProfitPage}
          />
        )}
      </CardContent>
    </Card>
  );
}
