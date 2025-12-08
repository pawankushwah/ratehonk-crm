import React from 'react';
import { format } from 'date-fns';

export interface EstimateData {
  estimateNumber: string;
  validUntil: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
  items: {
    description: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: string;
    discount?: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  depositPercentage?: number;
}

interface EstimateTemplateProps {
  data: EstimateData;
}

// Modern Estimate Template (matching email/WhatsApp format)
export const ModernEstimateTemplate: React.FC<EstimateTemplateProps> = ({ data }) => (
  <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div className="flex justify-between items-start mb-8">
      <div className="flex items-center space-x-4">
        {data.companyLogo && (
          <img src={data.companyLogo} alt="Company Logo" className="h-12 w-auto" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.companyName}</h1>
          <p className="text-gray-600">{data.companyEmail}</p>
          {data.companyPhone && <p className="text-gray-600">{data.companyPhone}</p>}
          {data.companyAddress && <p className="text-gray-600">{data.companyAddress}</p>}
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">ESTIMATE</h2>
        <p className="text-lg font-semibold">#{data.estimateNumber}</p>
        <p className="text-gray-600">Date: {format(new Date(), 'MMM dd, yyyy')}</p>
        {data.validUntil && (
          <p className="text-gray-600">Valid Until: {format(new Date(data.validUntil), 'MMM dd, yyyy')}</p>
        )}
      </div>
    </div>

    {/* Bill To */}
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold">{data.customerName}</p>
        <p className="text-gray-600">{data.customerEmail}</p>
        {data.customerPhone && <p className="text-gray-600">{data.customerPhone}</p>}
        {data.customerAddress && <p className="text-gray-600">{data.customerAddress}</p>}
      </div>
    </div>

    {/* Items Table */}
    {data.items && data.items.length > 0 && (
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border-b-2 border-blue-200 p-3 text-left font-semibold">Description</th>
              {data.items.some(item => item.category) && (
                <th className="border-b-2 border-blue-200 p-3 text-left font-semibold">Category</th>
              )}
              <th className="border-b-2 border-blue-200 p-3 text-center font-semibold">Qty</th>
              <th className="border-b-2 border-blue-200 p-3 text-right font-semibold">Unit Price</th>
              {data.items.some(item => item.taxRate) && (
                <th className="border-b-2 border-blue-200 p-3 text-center font-semibold">Tax Rate</th>
              )}
              {data.items.some(item => item.discount && item.discount > 0) && (
                <th className="border-b-2 border-blue-200 p-3 text-right font-semibold">Discount</th>
              )}
              <th className="border-b-2 border-blue-200 p-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-3">{item.description}</td>
                {data.items.some(i => i.category) && (
                  <td className="p-3">{item.category || "-"}</td>
                )}
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{getCurrencySymbol(data.currency)}{item.unitPrice.toFixed(2)}</td>
                {data.items.some(i => i.taxRate) && (
                  <td className="p-3 text-center">{item.taxRate || "-"}</td>
                )}
                {data.items.some(i => i.discount && i.discount > 0) && (
                  <td className="p-3 text-right">
                    {item.discount && item.discount > 0 
                      ? `${getCurrencySymbol(data.currency)}${item.discount.toFixed(2)}` 
                      : "-"}
                  </td>
                )}
                <td className="p-3 text-right">{getCurrencySymbol(data.currency)}{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-64">
        <div className="flex justify-between py-2">
          <span>Subtotal:</span>
          <span>{getCurrencySymbol(data.currency)}{data.subtotal.toFixed(2)}</span>
        </div>
        {data.discountAmount > 0 && (
          <div className="flex justify-between py-2 text-green-600">
            <span>Discount:</span>
            <span>-{getCurrencySymbol(data.currency)}{data.discountAmount.toFixed(2)}</span>
          </div>
        )}
        {data.taxAmount > 0 && (
          <div className="flex justify-between py-2">
            <span>Tax:</span>
            <span>{getCurrencySymbol(data.currency)}{data.taxAmount.toFixed(2)}</span>
          </div>
        )}
        {data.depositRequired && data.depositAmount && data.depositAmount > 0 && (
          <div className="flex justify-between py-2 text-orange-600">
            <span>Deposit Required:</span>
            <span>{getCurrencySymbol(data.currency)}{data.depositAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-2">
          <div className="flex justify-between py-2 text-xl font-bold">
            <span>Total:</span>
            <span>{getCurrencySymbol(data.currency)}{data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Payment Terms and Deposit */}
    {(data.paymentTerms || data.depositRequired) && (
      <div className="mb-8 border-t pt-6">
        {data.paymentTerms && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Payment Terms:</h4>
            <p className="text-gray-600">{data.paymentTerms}</p>
          </div>
        )}
        {data.depositRequired && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Deposit:</h4>
            <p className="text-gray-600">
              A deposit of {getCurrencySymbol(data.currency)}{data.depositAmount?.toFixed(2) || '0.00'} 
              {data.depositPercentage ? ` (${data.depositPercentage}%)` : ''} is required.
            </p>
          </div>
        )}
      </div>
    )}

    {/* Footer */}
    {data.notes && (
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-2">Notes:</h4>
        <div 
          className="text-gray-600 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.notes }}
        />
      </div>
    )}
  </div>
);

// Helper function to get currency symbol
function getCurrencySymbol(currencyCode: string): string {
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
}

