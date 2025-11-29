import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/ui/date-filter";
import { ProfitLossList } from "./ProfitLossList";
import { useProfitLossData } from "@/hooks/useDashboardData";


const dummyProfitLoss = [
  { month: "2024-12", expenses: 12000, revenue: 18000, profit: 6000 },
  { month: "2025-01", expenses: 15000, revenue: 23000, profit: 8000 },
  { month: "2025-02", expenses: 14000, revenue: 22000, profit: 8000 },
  { month: "2025-03", expenses: 10000, revenue: 26000, profit: 16000 },
  { month: "2025-04", expenses: 9000, revenue: 20000, profit: 11000 },
  { month: "2025-05", expenses: 13000, revenue: 28000, profit: 15000 },
  { month: "2025-06", expenses: 11000, revenue: 25000, profit: 14000 },
  { month: "2025-07", expenses: 14000, revenue: 30000, profit: 16000 },
  { month: "2025-08", expenses: 12000, revenue: 27000, profit: 15000 },
  { month: "2025-09", expenses: 15000, revenue: 32000, profit: 17000 },
  { month: "2025-10", expenses: 18000, revenue: 35000, profit: 17000 },
  { month: "2025-11", expenses: 20000, revenue: 42000, profit: 22000 },
  { month: "2025-12", expenses: 16000, revenue: 30000, profit: 14000 },
];

export function ProfitLossCard() {
  const [profitPage, setProfitPage] = useState(0);

  const [dateFilter, setDateFilter] = useState("this_year");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: profitLossData = [], isLoading } = useProfitLossData(
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const isDataEmpty =
    !profitLossData ||
    profitLossData.length === 0 ||
    profitLossData.every(
      (m) => m.expenses === 0 && m.revenue === 0 && m.profit === 0
    );

  const finalProfitLoss = isDataEmpty ? dummyProfitLoss : profitLossData;




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
