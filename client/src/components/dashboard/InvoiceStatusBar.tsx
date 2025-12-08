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

  const {
    data: invoiceGraphData = [],
    isLoading,
  } = useInvoicesForGraph(
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


  const paid = invoiceGraphData.filter((inv) => inv.status === "paid")?.length || 0;
  const partialPaid =
    invoiceGraphData.filter((inv) => inv.status === "partial")?.length || 0;
  const pending =
    invoiceGraphData.filter((inv) => inv.status === "pending")?.length || 0;
  const overdue =
    invoiceGraphData.filter((inv) => inv.status === "overdue")?.length || 0;

  const finalPaid = paid  
  const finalPartial =  partialPaid 
  const finalPending =  pending 
  const finalOverdue =  overdue 

  const total = finalPaid + finalPartial + finalPending + finalOverdue;

  const invoiceMetrics = {
    total,
    paid: finalPaid,
    partialPaid: finalPartial,
    pending: finalPending,
    overdue: finalOverdue,
    paidPercentage: (finalPaid / total) * 100,
    partialPercentage: (finalPartial / total) * 100,
    pendingPercentage: (finalPending / total) * 100,
    overduePercentage: (finalOverdue / total) * 100,
  };


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

          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDateFrom={customDateFrom}
            setCustomDateFrom={setCustomDateFrom}
            customDateTo={customDateTo}
            setCustomDateTo={setCustomDateTo}
          />
        </div>

        <CardDescription className="text-lg sm:text-2xl font-semibold text-[#000000] mt-4">
          {invoiceMetrics.total} Total Invoices
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex h-8 sm:h-12 overflow-hidden text-white text-sm sm:text-base font-medium mt-12 rounded">

          {invoiceMetrics.paid > 0 && (
            <div
              className="bg-[#2374A9] flex items-center justify-center text-[#FFFFFF]"
              style={{ width: `${invoiceMetrics.paidPercentage}%` }}
            >
              {invoiceMetrics.paid}
            </div>
          )}

          {invoiceMetrics.overdue > 0 && (
            <div
              className="bg-[#FE1F02] flex items-center justify-center text-[#FFFFFF]"
              style={{ width: `${invoiceMetrics.overduePercentage}%` }}
            >
              {invoiceMetrics.overdue}
            </div>
          )}

          {invoiceMetrics.partialPaid > 0 && (
            <div
              className="bg-[#787EDA] flex items-center justify-center text-[#FFFFFF]"
              style={{ width: `${invoiceMetrics.partialPercentage}%` }}
            >
              {invoiceMetrics.partialPaid}
            </div>
          )}

          {invoiceMetrics.pending > 0 && (
            <div
              className="bg-[#FE4F02] flex items-center justify-center text-[#FFFFFF]"
              style={{ width: `${invoiceMetrics.pendingPercentage}%` }}
            >
              {invoiceMetrics.pending}
            </div>
          )}
        </div>

       
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 text-xs sm:text-sm mt-20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2374A9]"></div>
            <span className="text-gray-600">Paid {invoiceMetrics.paid}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#787EDA]"></div>
            <span className="text-gray-600">
              Partial Paid {invoiceMetrics.partialPaid}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FE4F02]"></div>
            <span className="text-gray-600">
              Pending {invoiceMetrics.pending}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FE1F02]"></div>
            <span className="text-gray-600">
              Overdue {invoiceMetrics.overdue}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
