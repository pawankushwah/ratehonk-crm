import { useState } from "react";
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

  const [dateFilter, setDateFilter] = useState("this_year");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const {
    data: invoiceGraphData = [],
    isLoading,
  } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  
  const dummyStatusData = {
    paid: 40,
    partialPaid: 20,
    pending: 25,
    overdue: 15,
  };

  const realTotal = invoiceGraphData.length;

  const paid = invoiceGraphData.filter((inv) => inv.status === "paid")?.length || 0;
  const partialPaid = invoiceGraphData.filter((inv) => inv.status === "partial")?.length || 0;
  const pending = invoiceGraphData.filter((inv) => inv.status === "pending")?.length || 0;
  const overdue = invoiceGraphData.filter((inv) => inv.status === "overdue")?.length || 0;


  const finalPaid = realTotal > 0 ? paid : dummyStatusData.paid;
  const finalPartial = realTotal > 0 ? partialPaid : dummyStatusData.partialPaid;
  const finalPending = realTotal > 0 ? pending : dummyStatusData.pending;
  const finalOverdue = realTotal > 0 ? overdue : dummyStatusData.overdue;

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

  if (isLoading) {
    return (
      <div className="flex h-8 sm:h-12 overflow-hidden bg-gray-200 animate-pulse mt-12 rounded"></div>
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
          {realTotal === 0 && " (Dummy Data)"}
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

        {/* LEGENDS */}
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
