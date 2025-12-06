import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DateFilter } from "@/components/ui/date-filter";
import { useAuth } from "@/components/auth/auth-provider";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";

export function InvoiceStatusBar() {
  const { tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const [localLoading, setLocalLoading] = useState(false);

  const { data: invoiceGraphData = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  useEffect(() => {
    setLocalLoading(true);
    const timer = setTimeout(() => setLocalLoading(false), 500);
    return () => clearTimeout(timer);
  }, [dateFilter, customDateFrom, customDateTo]);

  const paid =
    invoiceGraphData.filter((inv) => inv.status === "paid")?.length || 0;
  const partialPaid =
    invoiceGraphData.filter((inv) => inv.status === "partial")?.length || 0;
  const pending =
    invoiceGraphData.filter((inv) => inv.status === "pending")?.length || 0;
  const overdue =
    invoiceGraphData.filter((inv) => inv.status === "overdue")?.length || 0;

  const total = paid + partialPaid + pending + overdue;

  const invoiceMetrics = {
    total,
    paid,
    partialPaid,
    pending,
    overdue,
    paidPercentage: total ? (paid / total) * 100 : 0,
    partialPercentage: total ? (partialPaid / total) * 100 : 0,
    pendingPercentage: total ? (pending / total) * 100 : 0,
    overduePercentage: total ? (overdue / total) * 100 : 0,
  };

  const usingDummy = invoiceMetrics.total === 0;

  const dummyMetrics = {
    total: 10,
    paid: 4,
    partialPaid: 2,
    pending: 3,
    overdue: 1,
    paidPercentage: 40,
    partialPercentage: 20,
    pendingPercentage: 30,
    overduePercentage: 10,
  };

  const displayMetrics = usingDummy ? dummyMetrics : invoiceMetrics;

  const COLORS_REAL = {
    paid: "#2374A9",
    overdue: "#FE1F02",
    partial: "#787EDA",
    pending: "#FE4F02",
  };

  const COLORS_DUMMY = {
    paid: "#CFCFCF",
    overdue: "#D9D9D9",
    partial: "#E5E5E5",
    pending: "#BFBFBF",
  };

  const C = usingDummy ? COLORS_DUMMY : COLORS_REAL;

  if (isLoading || localLoading) {
    return (
      <Card className="lg:col-span-12 bg-white shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-[#000000] text-base sm:text-lg">
            Invoice Status
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-center h-40 sm:h-52 w-full rounded-lg bg-gray-100 animate-pulse">
            <p className="text-gray-500 text-base sm:text-lg">
              Loading invoices...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-12 bg-white shadow-md rounded-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-[#000000] text-base sm:text-lg">
            Invoice Status
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

        <CardDescription className="text-lg sm:text-2xl font-semibold text-[#000000] mt-4">
          {!usingDummy && <span>{displayMetrics.total} Total Invoices</span>}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex h-8 sm:h-12 overflow-hidden text-white text-sm sm:text-base font-medium mt-12 rounded">
          {displayMetrics.paid > 0 && (
            <div
              className="flex items-center justify-center"
              style={{
                backgroundColor: C.paid,
                width: `${displayMetrics.paidPercentage}%`,
                transition: "width 0.8s ease",
                color: usingDummy ? "#555" : "#FFF",
              }}
            >
              {displayMetrics.paid}
            </div>
          )}

          {displayMetrics.overdue > 0 && (
            <div
              className="flex items-center justify-center"
              style={{
                backgroundColor: C.overdue,
                width: `${displayMetrics.overduePercentage}%`,
                transition: "width 0.8s ease",
                color: usingDummy ? "#555" : "#FFF",
              }}
            >
              {displayMetrics.overdue}
            </div>
          )}

          {displayMetrics.partialPaid > 0 && (
            <div
              className="flex items-center justify-center"
              style={{
                backgroundColor: C.partial,
                width: `${displayMetrics.partialPercentage}%`,
                transition: "width 0.8s ease",
                color: usingDummy ? "#555" : "#FFF",
              }}
            >
              {displayMetrics.partialPaid}
            </div>
          )}

          {displayMetrics.pending > 0 && (
            <div
              className="flex items-center justify-center"
              style={{
                backgroundColor: C.pending,
                width: `${displayMetrics.pendingPercentage}%`,
                transition: "width 0.8s ease",
                color: usingDummy ? "#555" : "#FFF",
              }}
            >
              {displayMetrics.pending}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 text-xs sm:text-sm mt-20">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: C.paid }}
            ></div>
            <span className="text-gray-600">Paid {displayMetrics.paid}</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: C.partial }}
            ></div>
            <span className="text-gray-600">
              Partial Paid {displayMetrics.partialPaid}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: C.pending }}
            ></div>
            <span className="text-gray-600">
              Pending {displayMetrics.pending}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: C.overdue }}
            ></div>
            <span className="text-gray-600">
              Overdue {displayMetrics.overdue}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
