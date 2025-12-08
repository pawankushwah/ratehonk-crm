import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RateHonkLogo } from "@/components/ui/ratehonk-logo";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "../../assets/Logo-sidebar.svg"

interface EstimateLineItem {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  category?: string;
  taxRate?: string;
  discount?: number;
  tax?: number;
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
  hideActions?: boolean;
  onDownloadPDF?: () => void;
}

export const EstimatePreview = forwardRef<HTMLDivElement, EstimatePreviewProps>(
  ({ estimate, companyInfo, hideActions = false, onDownloadPDF }, ref) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

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
      if (!componentRef.current) {
        console.error("PDF generation failed: componentRef is null");
        toast({
          title: "Error",
          description: "Failed to generate PDF. Content not available.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Show loading indicator
        toast({
          title: "Generating PDF",
          description: "Please wait...",
        });

        // Wait a bit for any images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(componentRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false,
          onclone: (clonedDoc) => {
            // Ensure all images are loaded in the cloned document
            const images = clonedDoc.querySelectorAll('img');
            images.forEach((img: any) => {
              if (!img.complete) {
                img.style.display = 'none';
              }
            });
          }
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Handle multi-page PDF if content is too long
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`Estimate-${estimate.estimateNumber}.pdf`);
        
        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        });
      } catch (error: any) {
        console.error("PDF generation error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Expose download function to parent if provided
    useImperativeHandle(ref, () => ({
      downloadPDF: handleDownloadPDF,
    } as any));

    return (
      <div className="w-full">
        {/* Action Buttons - Hidden when hideActions is true */}
        {!hideActions && (
          <div className="flex justify-end space-x-2 mb-4">
            <Button variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>Download PDF</Button>
          </div>
        )}

        <div ref={componentRef} data-estimate-preview-content className="max-w-4xl mx-auto bg-white p-8 print:p-0" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
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
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-[180px] h-[60px] object-contain rounded-md bg-white p-2"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '20px' }}>
                  {companyInfo?.name || "Your Company Name"}
                </h1>
                {companyInfo?.address && (
                  <p className="text-gray-600" style={{ fontSize: '12px' }}>{companyInfo.address}</p>
                )}
                {companyInfo?.phone && (
                  <p className="text-gray-600" style={{ fontSize: '12px' }}>{companyInfo.phone}</p>
                )}
                {companyInfo?.email && (
                  <p className="text-gray-600" style={{ fontSize: '12px' }}>{companyInfo.email}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontSize: '24px' }}>ESTIMATE</h2>
              <div className="space-y-1 mt-2" style={{ fontSize: '12px' }}>
                <div>
                  <span className="font-semibold">ESTIMATE #:</span> {estimate.estimateNumber}
                </div>
                <div>
                  <span className="font-semibold">DATE:</span> {formatDate(estimate.createdAt)}
                </div>
                {estimate.validUntil && (
                  <div>
                    <span className="font-semibold">VALID UNTIL:</span> {formatDate(estimate.validUntil)}
                  </div>
                )}
                <div>
                  <span className="font-semibold">TERMS:</span> {estimate.paymentTerms || "net30"}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '14px' }}>BILL TO:</h3>
            <div className="text-gray-700" style={{ fontSize: '12px' }}>
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

          <Separator className="mb-6" />

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 font-semibold text-gray-900" style={{ fontSize: '12px' }}>
                    ACTIVITY
                  </th>
                  {estimate.lineItems?.some(item => item.category) && (
                    <th className="text-left py-3 px-2 font-semibold text-gray-900" style={{ fontSize: '12px' }}>
                      CATEGORY
                    </th>
                  )}
                  <th className="text-center py-3 px-2 font-semibold text-gray-900 w-20" style={{ fontSize: '12px' }}>
                    QTY
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 w-24" style={{ fontSize: '12px' }}>
                    RATE
                  </th>
                  {estimate.lineItems?.some(item => item.taxRate) && (
                    <th className="text-center py-3 px-2 font-semibold text-gray-900" style={{ fontSize: '12px' }}>
                      TAX RATE
                    </th>
                  )}
                  {estimate.lineItems?.some(item => item.discount !== undefined && item.discount !== null) && (
                    <th className="text-right py-3 px-2 font-semibold text-gray-900" style={{ fontSize: '12px' }}>
                      DISCOUNT
                    </th>
                  )}
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 w-24" style={{ fontSize: '12px' }}>
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.lineItems && estimate.lineItems.length > 0 ? (
                  estimate.lineItems.map((item, index) => {
                    const hasCategory = estimate.lineItems?.some(i => i.category);
                    const hasTaxRate = estimate.lineItems?.some(i => i.taxRate);
                    const hasDiscount = estimate.lineItems?.some(i => i.discount !== undefined && i.discount !== null);
                    const colSpan = 4 + (hasCategory ? 1 : 0) + (hasTaxRate ? 1 : 0) + (hasDiscount ? 1 : 0);
                    
                    return (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 px-2" style={{ fontSize: '12px' }}>
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.itemName}
                            </div>
                            {item.description && (
                              <div className="text-gray-600 mt-1" style={{ fontSize: '11px' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </td>
                        {hasCategory && (
                          <td className="py-3 px-2 text-gray-700" style={{ fontSize: '12px' }}>
                            {item.category || "-"}
                          </td>
                        )}
                        <td className="py-3 px-2 text-center text-gray-700" style={{ fontSize: '12px' }}>
                          {parseFloat(item.quantity.toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-700" style={{ fontSize: '12px' }}>
                          {formatCurrency(item.unitPrice)}
                        </td>
                        {hasTaxRate && (
                          <td className="py-3 px-2 text-center text-gray-700" style={{ fontSize: '12px' }}>
                            {item.taxRate || "-"}
                          </td>
                        )}
                        {hasDiscount && (
                          <td className="py-3 px-2 text-right text-gray-700" style={{ fontSize: '12px' }}>
                            {item.discount !== undefined && item.discount !== null && parseFloat(item.discount.toString()) > 0 
                              ? formatCurrency(item.discount.toString())
                              : "-"}
                          </td>
                        )}
                        <td className="py-3 px-2 text-right font-medium text-gray-900" style={{ fontSize: '12px' }}>
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500" style={{ fontSize: '12px' }}>
                      No line items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="mb-6" />

          {/* Message and Totals Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Message Section */}
            {estimate.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '12px' }}>MESSAGE:</h4>
                <p className="text-gray-700 whitespace-pre-line" style={{ fontSize: '12px' }}>
                  {estimate.notes}
                </p>
              </div>
            )}

            {/* Totals Section */}
            <div className="text-right">
              <div className="space-y-2">
                <div className="flex justify-between" style={{ fontSize: '12px' }}>
                  <span className="font-medium">SUBTOTAL:</span>
                  <span>{formatCurrency(estimate.subtotal)}</span>
                </div>

                {estimate.taxAmount && parseFloat(estimate.taxAmount) > 0 && (
                  <div className="flex justify-between" style={{ fontSize: '12px' }}>
                    <span className="font-medium">
                      TAX {estimate.taxRate ? `(${estimate.taxRate}%)` : ""}:
                    </span>
                    <span>{formatCurrency(estimate.taxAmount)}</span>
                  </div>
                )}

                {estimate.discountAmount &&
                  parseFloat(estimate.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600" style={{ fontSize: '12px' }}>
                      <span className="font-medium">
                        DISCOUNT
                        {estimate.discountType === "percentage" &&
                        estimate.discountValue
                          ? `(${estimate.discountValue}%)`
                          : ""}:
                      </span>
                      <span>-{formatCurrency(estimate.discountAmount)}</span>
                    </div>
                  )}

                <Separator />

                <div className="flex justify-between font-bold text-gray-900" style={{ fontSize: '12px' }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(estimate.totalAmount)}</span>
                </div>

                {estimate.depositRequired &&
                  estimate.depositAmount &&
                  parseFloat(estimate.depositAmount) > 0 && (
                    <div className="flex justify-between font-medium text-blue-600" style={{ fontSize: '12px' }}>
                      <span>
                        DEPOSIT ({estimate.depositPercentage ? `${estimate.depositPercentage}%` : "100%"}):
                      </span>
                      <span>{formatCurrency(estimate.depositAmount)}</span>
                    </div>
                  )}

                <div className="mt-4">
                  <div className="flex justify-between font-bold" style={{ fontSize: '12px' }}>
                    <span>BALANCE DUE:</span>
                    <span className="text-green-600">
                      {formatCurrency(estimate.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500" style={{ fontSize: '11px' }}>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    );
  }
);

EstimatePreview.displayName = "EstimatePreview";
