import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
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

export function ConsolidatedVendorBookingChart() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const vendorData = useMemo(() => {
    const amountMap: Record<string, number> = {};

    // Filter invoices to only include paid or partial paid invoices (same as profit-loss API)
    const paidInvoices = invoices.filter((inv: any) => {
      const status = (inv.status || '').toLowerCase();
      return status === 'paid' || status === 'partial' || status === 'partially_paid';
    });

    paidInvoices.forEach((inv) => {
      const totalAmount = parseFloat(inv.totalAmount || inv.total_amount || 0);
      const paidAmount = parseFloat(inv.paidAmount || inv.paid_amount || 0);
      
      // Calculate the proportion of paid amount to total amount
      const paidProportion = totalAmount > 0 ? paidAmount / totalAmount : 0;

      (inv.lineItems || []).forEach((li) => {
        if (!li.vendorName) return;
        
        // Calculate the paid portion of this line item
        const lineItemAmount = parseFloat(li.totalAmount || li.amount || li.total_amount || 0);
        const paidLineItemAmount = lineItemAmount * paidProportion;
        
        amountMap[li.vendorName] = (amountMap[li.vendorName] || 0) + paidLineItemAmount;
      });
    });

    const total = Object.values(amountMap).reduce((a, b) => a + b, 0);
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

    return Object.keys(amountMap).map((vendor, idx) => ({
      name: vendor,
      amount: amountMap[vendor],
      percentage: Number(((amountMap[vendor] / total) * 100).toFixed(2)),
      color: colorPalette[idx % colorPalette.length],
    }));
  }, [invoices]);


  const dummyColorPalette = ["#A5A5A5", "#B0B0B0", "#C0C0C0"];
  const dummyHoverPalette = ["#2F80ED", "#F66D44", "#219653"]; 

  const dummyData = [
    { name: "Category 0", percentage: 40, amount: 0 },
    { name: "Category 1", percentage: 30, amount: 0 },
    { name: "Category 2", percentage: 30, amount: 0 },
  ];

  const usingDummy = vendorData.length === 0;

  const displayData = usingDummy
    ? dummyData.map((d, i) => ({
        ...d,
        color:
          activeIndex === i
            ? dummyHoverPalette[i % dummyHoverPalette.length] 
            : dummyColorPalette[i % dummyColorPalette.length], 
      }))
    : vendorData;

  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-md p-2 border text-xs text-black">
          <p className="font-semibold">{item.name}</p>
          <p>{usingDummy ? `${currencySymbol}0.00` : `${currencySymbol}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
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

      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="relative w-full h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />

                 
                  <Pie
                    data={displayData}
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
                    {displayData.map((entry, index) => (
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
                    data={displayData}
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
                    {displayData.map((entry, index) => (
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
              {displayData.map((v, idx) => (
                <div className="flex items-center gap-2" key={idx}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: v.color }}
                  ></div>

                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-gray-500 text-[11px]">{usingDummy ? `${currencySymbol}0.00` : `${currencySymbol}${(v.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
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
