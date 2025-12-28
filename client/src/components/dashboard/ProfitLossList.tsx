import { useAuth } from "../auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
    CNY: "¥",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
  };
  return symbols[currencyCode] || currencyCode;
};

interface ProfitLossListProps {
  profitLossData: Array<{
    month: string;
    expenses: number;
    revenue: number;
    profit: number;
  }>;
  profitPage: number;
  setProfitPage: (page: number) => void;
}

export function ProfitLossList({
  profitLossData,
  profitPage,
  setProfitPage,
}: ProfitLossListProps) {
  const { tenant } = useAuth();

  // Fetch invoice settings to get currency
  const { data: invoiceSettings } = useQuery({
    queryKey: ["/api/invoice-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(
        `/api/invoice-settings/${tenant.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { defaultCurrency: "USD" };
      return await response.json();
    },
    enabled: !!tenant?.id,
  });

  const currentCurrency = invoiceSettings?.defaultCurrency || "USD";
  const currencySymbol = getCurrencySymbol(currentCurrency);

const latestYear = Array.isArray(profitLossData)
  ? Math.max(...profitLossData.map((m) => Number(m.month.split("-")[0])))
  : new Date().getFullYear();


const filtered = Array.isArray(profitLossData)
  ? profitLossData.filter(
      (m) => Number(m.month.split("-")[0]) === latestYear
    )
  : [];


const sortedProfitLossData = [...filtered].sort((a, b) => {
  const [, monthA] = a.month.split("-").map(Number);
  const [, monthB] = b.month.split("-").map(Number);

  return monthA - monthB;
});



  const maxValue =
    sortedProfitLossData.length > 0
      ? Math.max(
          ...sortedProfitLossData.map((d) =>
            Math.abs((d.revenue ?? 0) - (d.expenses ?? 0))
          ),
          1
        )
      : 1;

  const formatShort = (num: number) => {
    const abs = Math.abs(num);

    if (abs >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1) + "T";
    if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (abs >= 1_000) return (num / 1_000).toFixed(1) + "K";

    return num.toFixed(2);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedProfitLossData
        .slice(profitPage * 6, profitPage * 6 + 6)
        .map((item, i) => {
          const revenue = item.revenue ?? 0;
          const expenses = item.expenses ?? 0;
          const profit = revenue - expenses;
          const isLoss = profit < 0;
          const displayValue = `${currencySymbol}${formatShort(profit)}`;
          const widthPercentage = (Math.abs(profit) / maxValue) * 100;

          return (
            <div
              key={i}
              className="flex items-center justify-between text-xs sm:text-sm"
            >
              <span className="text-gray-500 w-6 sm:w-8">
                {new Date(item.month + "-01").toLocaleDateString("en-US", {
                  month: "short",
                })}
              </span>

              <div className="flex-1 bg-gray-200 h-2.5 sm:h-3 rounded overflow-hidden mx-2">
                <div
                  className={`${isLoss ? "bg-[#FE4F02]" : "bg-[#0A64A0]"} h-2.5 sm:h-3`}
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>

              <span className="text-[#202939] w-12 sm:w-14 text-right">
                {displayValue}
              </span>
            </div>
          );
        })}

      <div className="flex justify-center pt-2 gap-4">
        {profitPage > 0 && (
          <button
            onClick={() => setProfitPage(0)}
            className="text-[#02101a] text-sm font-semibold hover:underline"
          >
            ← Prev
          </button>
        )}

        {sortedProfitLossData.length > 6 && profitPage === 0 && (
          <button
            onClick={() => setProfitPage(1)}
            className="text-[#02101a] text-sm font-semibold hover:underline"
          >
            Next →
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#FE4F02]"></span> Loss
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#0A64A0]"></span> Profit
        </div>
      </div>
    </div>
  );
}
