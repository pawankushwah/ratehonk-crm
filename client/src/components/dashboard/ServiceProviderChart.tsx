import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Palette to match the provided reference (purple shades)
const SERVICE_PROVIDER_COLORS = [
  "#6D5EF7", // primary (dark)
  "#B8B3FF", // medium
  "#E4E1FF", // light
];

export function ServiceProviderChart() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedLeadTypeId, setSelectedLeadTypeId] = useState<string>("");

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: [`/api/lead-types`, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/lead-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.leadTypes || [];
    },
    enabled: !!tenant?.id,
  });

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

  const getLeadTypeBaseColor = (leadTypeId: string) => {
    const lt = leadTypes.find((x) => String(x.id) === String(leadTypeId));
    const name = String(lt?.name || "").toLowerCase();

    // Explicit mapping for the 3 lead types shown in your screenshot
    if (name.includes("default")) return SERVICE_PROVIDER_COLORS[0]; // dark
    if (name.includes("flight")) return SERVICE_PROVIDER_COLORS[1]; // medium
    if (name.includes("hotel")) return SERVICE_PROVIDER_COLORS[2]; // light

    // Fallback: stable by index
    const idx = Math.max(
      0,
      leadTypes.findIndex((x) => String(x.id) === String(leadTypeId)),
    );
    return SERVICE_PROVIDER_COLORS[idx % SERVICE_PROVIDER_COLORS.length];
  };

  const getPaletteForLeadType = (leadTypeId: string) => {
    const base = getLeadTypeBaseColor(leadTypeId);
    // Rotate palette so the first (largest) slice matches the lead type base color
    if (base === SERVICE_PROVIDER_COLORS[0]) return SERVICE_PROVIDER_COLORS; // dark, medium, light
    if (base === SERVICE_PROVIDER_COLORS[1])
      return [SERVICE_PROVIDER_COLORS[1], SERVICE_PROVIDER_COLORS[2], SERVICE_PROVIDER_COLORS[0]]; // medium, light, dark
    return [SERVICE_PROVIDER_COLORS[2], SERVICE_PROVIDER_COLORS[0], SERVICE_PROVIDER_COLORS[1]]; // light, dark, medium
  };

  const prepareProviderData = (list: any[]) => {
    if (!list || list.length === 0) return [];

    if (list.length <= 10) return list;

    const topTen = list.slice(0, 10);
    const otherList = list.slice(10);
    const otherValue = otherList.reduce((sum, item) => sum + item.value, 0);
    const otherAmount = otherList.reduce((sum, item) => sum + (item.amount || 0), 0);

    return [
      ...topTen,
      {
        name: "Other",
        amount: otherAmount,
        value: Number(otherValue.toFixed(2)),
        color: "#EDEBFF",
      },
    ];
  };

  const vendorData = useMemo(() => {
    if (!selectedLeadTypeId) return [];

    const vendorMap: Record<string, number> = {};

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
        // Check for lead type ID in multiple possible field names (now includes booking lead_type_id from backend)
        const lineItemLeadTypeId = li.leadTypeId || li.lead_type_id || li.packageId || li.package_id;
        // Check for vendor name (already resolved by backend) or vendor ID
        const vendorName = li.vendorName || li.vendor_name || (li.vendor ? `Vendor ${li.vendor}` : null);
        
        // Check if line item matches selected lead type and has a vendor
        if (lineItemLeadTypeId && vendorName && lineItemLeadTypeId.toString() === selectedLeadTypeId) {
          // Calculate the paid portion of this line item (invoice amount created by this vendor)
          const lineItemAmount = parseFloat(li.totalAmount || li.amount || li.total_amount || li.totalPrice || 0);
          const paidLineItemAmount = lineItemAmount * paidProportion;
          
          // Sum the invoice amounts per vendor (how much service invoice created by this vendor)
          vendorMap[vendorName] = (vendorMap[vendorName] || 0) + paidLineItemAmount;
        }
      });
    });

    const total = Object.values(vendorMap).reduce((sum, amount) => sum + amount, 0);
    if (total === 0) return [];

    const colors = getPaletteForLeadType(selectedLeadTypeId);

    const sorted = Object.entries(vendorMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const mapped = sorted.map((item, index) => ({
      name: item.name,
      amount: item.amount,
      value: Number(((item.amount / total) * 100).toFixed(2)),
      color: colors[index % colors.length],
    }));

    return prepareProviderData(mapped);
  }, [invoices, selectedLeadTypeId]);

  const dummyGray = ["#EDEBFF", "#F3F2FF", "#E4E1FF"];
  const dummyHover = selectedLeadTypeId
    ? getPaletteForLeadType(selectedLeadTypeId)
    : SERVICE_PROVIDER_COLORS;

  const dummyData = [
    { name: "Category 0", value: 40, amount: 0 },
    { name: "Category 1", value: 30, amount: 0 },
    { name: "Category 2", value: 30, amount: 0 },
  ];

  const usingDummy = vendorData.length === 0;

  const displayData = usingDummy
    ? dummyData.map((d, i) => ({
        ...d,
        color:
          activeIndex === i
            ? dummyHover[i % dummyHover.length]
            : dummyGray[i % dummyGray.length],
      }))
    : vendorData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-md px-3 py-2 text-xs border border-gray-200">
          <p className="font-semibold">{item.name}</p>
          <p className="text-gray-600">{usingDummy ? `${currencySymbol}0.00` : `${currencySymbol}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (leadTypes.length > 0 && !selectedLeadTypeId) {
      setSelectedLeadTypeId(leadTypes[0].id.toString());
    }
  }, [leadTypes, selectedLeadTypeId]);

  return (
    <Card className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-xl p-4">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <CardTitle className="text-black font-medium text-lg">
            Service Providers
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

        <div className="mb-5">
          {leadTypes.length > 0 && (
            <div className="mb-5">
              <Select
                value={selectedLeadTypeId}
                onValueChange={setSelectedLeadTypeId}
              >
                <SelectTrigger className="w-full sm:w-60">
                  <SelectValue placeholder="Select Lead Type">
                    {selectedLeadTypeId && leadTypes.find(lt => lt.id.toString() === selectedLeadTypeId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {leadTypes.map((leadType) => (
                    <SelectItem key={leadType.id} value={leadType.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getLeadTypeBaseColor(String(leadType.id)) }}
                        />
                        {leadType.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                  <Tooltip content={<CustomTooltip />} />

                  <Pie
                    data={displayData}
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
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {displayData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.color}
                        style={{
                          transition: "0.3s ease",
                          transformOrigin: "center",
                          cursor: "pointer",
                          transform:
                            activeIndex === idx ? "scale(1.08)" : "scale(1)",
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
              {displayData.map((item, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">{usingDummy ? `${currencySymbol}0.00` : `${currencySymbol}${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
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
