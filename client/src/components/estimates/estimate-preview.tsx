import { forwardRef, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RateHonkLogo } from "@/components/ui/ratehonk-logo";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "../../assets/Logo-sidebar.svg"

interface EstimateLineItem {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface EstimatePreviewProps {
  estimate: {
    estimateNumber: string;
    title: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    description?: string;
    subtotal: string;
    discountType?: string;
    discountValue?: string;
    discountAmount?: string;
    taxRate?: string;
    taxAmount?: string;
    totalAmount: string;
    depositRequired?: boolean;
    depositAmount?: string;
    depositPercentage?: string;
    paymentTerms?: string;
    notes?: string;
    validUntil?: string;
    status: string;
    lineItems?: EstimateLineItem[];
    createdAt?: string;
    logoUrl?: string;
    brandColor?: string;
  };
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

export const EstimatePreview = forwardRef<HTMLDivElement, EstimatePreviewProps>(
  ({ estimate, companyInfo }, ref) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: string | number) => {
      const num = typeof amount === "string" ? parseFloat(amount) : amount;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num || 0);
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return new Date().toLocaleDateString();
      return new Date(dateString).toLocaleDateString();
    };

    const handlePrint = useReactToPrint({
      contentRef: componentRef,
    });

    const handleDownloadPDF = async () => {
      if (!componentRef.current) return;

      const canvas = await html2canvas(componentRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Estimate-${estimate.estimateNumber}.pdf`);
    };

    return (
      <div className="w-full">
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mb-4">
          <Button variant="outline" onClick={handlePrint}>
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>Download PDF</Button>
        </div>

        <div ref={componentRef} className="max-w-4xl mx-auto bg-white p-8 print:p-0">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              {companyInfo?.logo ? (
                <img
                  src={companyInfo.logo}
                  alt="Company Logo"
                  className="h-16 w-auto"
                />
              ) : (
                // <RateHonkLogo className="h-16 w-auto" />
                 <img
                                  src={Logo}
                                  alt="Logo"
                                  className="w-[180px] h-[60px] object-contain center mx-auto rounded-md bg-white p-2"
                                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {companyInfo?.name || "Your Company Name"}
                </h1>
                {companyInfo?.address && (
                  <p className="text-sm text-gray-600">{companyInfo.address}</p>
                )}
                {companyInfo?.phone && (
                  <p className="text-sm text-gray-600">{companyInfo.phone}</p>
                )}
                {companyInfo?.email && (
                  <p className="text-sm text-gray-600">{companyInfo.email}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">ESTIMATE</h2>
              <Badge
                variant={estimate.status === "sent" ? "default" : "secondary"}
              >
                {estimate.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Estimate Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">BILL TO:</h3>
              <div className="text-sm text-gray-700">
                <p className="font-medium">{estimate.customerName}</p>
                {estimate.customerEmail && <p>{estimate.customerEmail}</p>}
                {estimate.customerPhone && <p>{estimate.customerPhone}</p>}
                {estimate.customerAddress && (
                  <div className="mt-2 whitespace-pre-line">
                    {estimate.customerAddress}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">ESTIMATE #:</span>
                  <span>{estimate.estimateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">DATE:</span>
                  <span>{formatDate(estimate.createdAt)}</span>
                </div>
                {estimate.validUntil && (
                  <div className="flex justify-between">
                    <span className="font-medium">VALID UNTIL:</span>
                    <span>{formatDate(estimate.validUntil)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">TERMS:</span>
                  <span>{estimate.paymentTerms || "Due on receipt"}</span>
                </div>
              </div>
            </div>
          </div>

          {estimate.title && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {estimate.title}
              </h3>
              {estimate.description && (
                <p className="text-gray-700 text-sm">{estimate.description}</p>
              )}
            </div>
          )}

          <Separator className="mb-6" />

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-semibold text-gray-900">
                    ACTIVITY
                  </th>
                  <th className="text-center py-2 font-semibold text-gray-900 w-20">
                    QTY
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-900 w-24">
                    RATE
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-900 w-24">
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.lineItems && estimate.lineItems.length > 0 ? (
                  estimate.lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.itemName}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No line items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="mb-6" />

          {/* Message Section */}
          {estimate.notes && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-2">MESSAGE:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {estimate.notes}
              </p>
            </div>
          )}

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">SUBTOTAL</span>
                  <span>{formatCurrency(estimate.subtotal)}</span>
                </div>

                {estimate.discountAmount &&
                  parseFloat(estimate.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium">
                        DISCOUNT
                        {estimate.discountType === "percentage" &&
                        estimate.discountValue
                          ? `(${estimate.discountValue}%)`
                          : ""}
                      </span>
                      <span>-{formatCurrency(estimate.discountAmount)}</span>
                    </div>
                  )}

                {estimate.taxAmount && parseFloat(estimate.taxAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      TAX {estimate.taxRate ? `(${estimate.taxRate}%)` : ""}
                    </span>
                    <span>{formatCurrency(estimate.taxAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL</span>
                  <span>{formatCurrency(estimate.totalAmount)}</span>
                </div>

                {estimate.depositRequired &&
                  estimate.depositAmount &&
                  parseFloat(estimate.depositAmount) > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm font-medium text-blue-600">
                        <span>
                          DEPOSIT
                          {estimate.depositPercentage
                            ? `(${estimate.depositPercentage}%)`
                            : ""}
                        </span>
                        <span>{formatCurrency(estimate.depositAmount)}</span>
                      </div>
                    </>
                  )}

                <div className="bg-gray-100 p-3 mt-4 rounded">
                  <div className="flex justify-between text-xl font-bold">
                    <span>BALANCE DUE</span>
                    <span className="text-green-600">
                      {formatCurrency(estimate.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    );
  }
);

EstimatePreview.displayName = "EstimatePreview";
