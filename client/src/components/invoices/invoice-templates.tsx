import React from 'react';
import { format } from 'date-fns';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
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
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    invoiceNumber?: string;
    voucherNumber?: string;
    date?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  cancellationChargeAmount?: number;
  cancellationChargeNotes?: string;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  paymentStatus?: string;
  paidAmount?: number;
  travelDate?: string;
  departureDate?: string;
  arrivalDate?: string;
  installments?: {
    installmentNumber: number;
    dueDate: string;
    amount: string;
  }[];
}

interface InvoiceTemplateProps {
  data: InvoiceData;
}

// Template 1: Modern Minimalist
export const ModernTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => (
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
          {data.companyAddress && <p className="text-gray-600 whitespace-pre-line">{data.companyAddress}</p>}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-3 mb-2">
          <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
          {data.paymentStatus?.toLowerCase() === "paid" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
              PAID
            </span>
          )}
        </div>
        <p className="text-lg font-semibold">#{data.invoiceNumber}</p>
        <p className="text-gray-600">Date: {format(new Date(data.issueDate), 'MMM dd, yyyy')}</p>
        {data.paymentStatus?.toLowerCase() !== "paid" && (
          <p className="text-gray-600">Due: {format(new Date(data.dueDate), 'MMM dd, yyyy')}</p>
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
    <div className="mb-8">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-50">
            <th className="border-b-2 border-blue-200 p-3 text-left font-semibold">Description</th>
            <th className="border-b-2 border-blue-200 p-3 text-center font-semibold">Qty</th>
            <th className="border-b-2 border-blue-200 p-3 text-right font-semibold">Unit Price</th>
            <th className="border-b-2 border-blue-200 p-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="p-3">
                <div>{item.description}</div>
                {item.date && (
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
                {(item.invoiceNumber || item.voucherNumber) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.invoiceNumber && <span>Invoice: {item.invoiceNumber}</span>}
                    {item.invoiceNumber && item.voucherNumber && <span className="mx-2">|</span>}
                    {item.voucherNumber && <span>Voucher: {item.voucherNumber}</span>}
                  </div>
                )}
              </td>
              <td className="p-3 text-center">{item.quantity}</td>
              <td className="p-3 text-right">{data.currency} {item.unitPrice.toFixed(2)}</td>
              <td className="p-3 text-right">{data.currency} {item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-64">
        <div className="flex justify-between py-2">
          <span>Subtotal:</span>
          <span>{data.currency} {data.subtotal.toFixed(2)}</span>
        </div>
        {data.discountAmount > 0 && (
          <div className="flex justify-between py-2 text-green-600">
            <span>Discount:</span>
            <span>-{data.currency} {data.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between py-2">
          <span>Tax:</span>
          <span>{data.currency} {data.taxAmount.toFixed(2)}</span>
        </div>
        {data.cancellationChargeAmount && data.cancellationChargeAmount > 0 && (
          <div className="flex justify-between py-2 text-red-600">
            <span>Cancellation Charge:</span>
            <span>{data.currency} {data.cancellationChargeAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-2">
          <div className="flex justify-between py-2 text-xl font-bold">
            <span>Total:</span>
            <span>{data.currency} {data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Payment Information */}
    {data.paymentStatus?.toLowerCase() !== "paid" && (data.paymentStatus || (data.paidAmount || 0) > 0) && (
      <div className="mb-8 border-t pt-6">
        <h3 className="font-semibold mb-3 text-gray-800">Payment Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {data.paymentStatus && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Payment Status:</span>
              <span className="font-semibold text-gray-900 capitalize">{data.paymentStatus}</span>
            </div>
          )}
          {(data.paidAmount || 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Amount Paid:</span>
              <span className="font-semibold text-gray-900">
                {data.currency}{(data.paidAmount || 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-gray-700 font-medium">Balance Due:</span>
            <span className="font-bold text-gray-900">
              {data.currency}{(data.totalAmount - (data.paidAmount || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    )}

    {/* Installment Details */}
    {data.installments && data.installments.length > 0 && (
      <div className="mb-8">
        <h3 className="font-semibold mb-3 text-gray-800">Payment Installment Plan</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Installment #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.installments.map((inst, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900">{inst.installmentNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {format(new Date(inst.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {data.currency}{parseFloat(inst.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Pending:</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {data.currency}{(
                    data.totalAmount - (data.paidAmount || 0)
                  ).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )}

    {/* Footer */}
    {(data.notes || (data.paymentTerms && data.paymentTerms !== "0" && data.paymentStatus?.toLowerCase() !== "paid") || data.cancellationChargeNotes) && (
      <div className="border-t pt-6">
        {data.paymentTerms && data.paymentTerms !== "0" && data.paymentStatus?.toLowerCase() !== "paid" && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Payment Terms:</h4>
            <p className="text-gray-600">{data.paymentTerms}</p>
          </div>
        )}
        {data.cancellationChargeNotes && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-red-600">Cancellation Charge Notes:</h4>
            <p className="text-gray-600">{data.cancellationChargeNotes}</p>
          </div>
        )}
        {data.notes && (
          <div>
            <h4 className="font-semibold mb-2">Notes:</h4>
            <div 
              className="text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: data.notes }}
            />
          </div>
        )}
      </div>
    )}
  </div>
);

// Template 2: Professional Corporate
export const CorporateTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => (
  <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
    {/* Header with dark band */}
    <div className="bg-gray-800 text-white p-6 mb-8 -mx-8 -mt-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {data.companyLogo && (
            <img src={data.companyLogo} alt="Company Logo" className="h-16 w-auto filter brightness-0 invert" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{data.companyName}</h1>
            <p className="opacity-90">{data.companyEmail}</p>
            {data.companyAddress && <p className="opacity-90 whitespace-pre-line text-sm mt-1">{data.companyAddress}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-3 mb-2">
            <h2 className="text-3xl font-bold">INVOICE</h2>
            {data.paymentStatus?.toLowerCase() === "paid" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                PAID
              </span>
            )}
          </div>
          <p className="text-xl">#{data.invoiceNumber}</p>
        </div>
      </div>
    </div>

    {/* Invoice Details */}
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Invoice Details</h3>
        <div className="space-y-2">
          <div className="flex">
            <span className="w-24 font-medium">Date:</span>
            <span>{format(new Date(data.issueDate), 'MMMM dd, yyyy')}</span>
          </div>
          {data.paymentStatus?.toLowerCase() !== "paid" && (
            <div className="flex">
              <span className="w-24 font-medium">Due Date:</span>
              <span>{format(new Date(data.dueDate), 'MMMM dd, yyyy')}</span>
            </div>
          )}
          {data.paymentStatus?.toLowerCase() !== "paid" && data.paymentTerms && data.paymentTerms !== "0" && (
            <div className="flex">
              <span className="w-24 font-medium">Terms:</span>
              <span>{data.paymentTerms || 'Net 30'}</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Bill To</h3>
        <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-800">
          <p className="font-bold text-lg">{data.customerName}</p>
          <p>{data.customerEmail}</p>
          {data.customerPhone && <p>{data.customerPhone}</p>}
          {data.customerAddress && <p className="mt-2">{data.customerAddress}</p>}
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-4 text-left">Service/Product</th>
            <th className="p-4 text-center">Quantity</th>
            <th className="p-4 text-right">Rate</th>
            <th className="p-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="p-4 border-b">
                <div>{item.description}</div>
                {item.date && (
                  <div className="text-xs text-gray-500 mt-1 italic">
                    {format(new Date(item.date), 'MMMM dd, yyyy HH:mm')}
                  </div>
                )}
              </td>
              <td className="p-4 text-center border-b">{item.quantity}</td>
              <td className="p-4 text-right border-b">{data.currency} {item.unitPrice.toFixed(2)}</td>
              <td className="p-4 text-right border-b font-medium">{data.currency} {item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Summary */}
    <div className="flex justify-end">
      <div className="w-80 bg-gray-50 p-6 rounded">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{data.currency} {data.subtotal.toFixed(2)}</span>
          </div>
          {data.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{data.currency} {data.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{data.currency} {data.taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-gray-800 pt-3">
            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span>{data.currency} {data.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notes */}
    {data.notes && (
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h4 className="font-bold mb-2">Additional Notes:</h4>
        <p className="text-gray-700">{data.notes}</p>
      </div>
    )}
  </div>
);

// Template 3: Creative Design
export const CreativeTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => (
  <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
    {/* Header with gradient */}
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 mb-8 -mx-8 -mt-8 rounded-b-3xl">
      <div className="flex justify-between items-start">
        <div>
          {data.companyLogo && (
            <img src={data.companyLogo} alt="Company Logo" className="h-12 w-auto mb-4 filter brightness-0 invert" />
          )}
          <h1 className="text-3xl font-bold mb-2">{data.companyName}</h1>
          <p className="opacity-90">{data.companyEmail}</p>
          {data.companyPhone && <p className="opacity-90">{data.companyPhone}</p>}
          {data.companyAddress && <p className="opacity-90 whitespace-pre-line text-sm mt-1">{data.companyAddress}</p>}
        </div>
        <div className="text-right">
          <div className="bg-white bg-opacity-20 p-4 rounded-2xl">
            <div className="flex items-center justify-end gap-2 mb-1">
              <h2 className="text-2xl font-bold">INVOICE</h2>
              {data.paymentStatus?.toLowerCase() === "paid" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                  PAID
                </span>
              )}
            </div>
            <p className="text-lg opacity-90">#{data.invoiceNumber}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Date and Customer Info */}
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-purple-800 mb-4">Invoice Information</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Issue Date:</span> {format(new Date(data.issueDate), 'MMM dd, yyyy')}</p>
          {data.paymentStatus?.toLowerCase() !== "paid" && (
            <p><span className="font-medium">Due Date:</span> {format(new Date(data.dueDate), 'MMM dd, yyyy')}</p>
          )}
          {data.paymentStatus?.toLowerCase() !== "paid" && (
            <p><span className="font-medium">Payment Terms:</span> {data.paymentTerms || 'Net 30'}</p>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-blue-800 mb-4">Billed To</h3>
        <p className="font-bold text-lg text-gray-800">{data.customerName}</p>
        <p className="text-gray-600">{data.customerEmail}</p>
        {data.customerPhone && <p className="text-gray-600">{data.customerPhone}</p>}
        {data.customerAddress && <p className="text-gray-600 mt-2">{data.customerAddress}</p>}
      </div>
    </div>

    {/* Items */}
    <div className="mb-8">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-t-2xl">
        <h3 className="text-lg font-bold text-gray-800">Services & Products</h3>
      </div>
      <div className="border-x-2 border-b-2 border-purple-200">
        {data.items.map((item, index) => (
          <div key={index} className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-25'} border-b border-purple-100`}>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium">{item.description}</p>
                {item.date && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
                <p className="text-sm text-gray-600">{item.quantity} × {data.currency} {item.unitPrice.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{data.currency} {item.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Total Section */}
    <div className="flex justify-end">
      <div className="w-80">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{data.currency} {data.subtotal.toFixed(2)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{data.currency} {data.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{data.currency} {data.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-purple-300 pt-3">
              <div className="flex justify-between text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl">
                <span>Total:</span>
                <span>{data.currency} {data.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notes */}
    {data.notes && (
      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border-l-4 border-orange-400">
        <h4 className="font-bold mb-2 text-orange-800">Additional Notes:</h4>
        <p className="text-gray-700">{data.notes}</p>
      </div>
    )}
  </div>
);

// Template 4: Classic Traditional
export const ClassicTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => (
  <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
    {/* Traditional Header */}
    <div className="text-center border-b-4 border-double border-gray-800 pb-6 mb-8">
      {data.companyLogo && (
        <img src={data.companyLogo} alt="Company Logo" className="h-16 w-auto mx-auto mb-4" />
      )}
      <h1 className="text-4xl font-bold text-gray-800 mb-2">{data.companyName}</h1>
      <p className="text-gray-600">{data.companyEmail} | {data.companyPhone}</p>
      {data.companyAddress && <p className="text-gray-600 whitespace-pre-line">{data.companyAddress}</p>}
    </div>

    {/* Invoice Title and Number */}
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
        {data.paymentStatus?.toLowerCase() === "paid" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
            PAID
          </span>
        )}
      </div>
      <p className="text-xl font-medium">Invoice No: {data.invoiceNumber}</p>
      <div className="flex justify-center space-x-8 mt-4">
        <div className="text-center">
          <p className="font-medium">Date Issued</p>
          <p className="border-b border-gray-400 pb-1">{format(new Date(data.issueDate), 'MMMM dd, yyyy')}</p>
        </div>
        {data.paymentStatus?.toLowerCase() !== "paid" && (
          <div className="text-center">
            <p className="font-medium">Due Date</p>
            <p className="border-b border-gray-400 pb-1">{format(new Date(data.dueDate), 'MMMM dd, yyyy')}</p>
          </div>
        )}
      </div>
    </div>

    {/* Bill To Section */}
    <div className="mb-8">
      <div className="border-2 border-gray-400 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 underline">BILL TO:</h3>
        <div className="text-lg leading-relaxed">
          <p className="font-bold">{data.customerName}</p>
          <p>{data.customerEmail}</p>
          {data.customerPhone && <p>{data.customerPhone}</p>}
          {data.customerAddress && <p className="mt-2">{data.customerAddress}</p>}
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <table className="w-full border-2 border-gray-800">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-600 p-3 text-left font-bold">DESCRIPTION</th>
            <th className="border border-gray-600 p-3 text-center font-bold">QTY</th>
            <th className="border border-gray-600 p-3 text-center font-bold">UNIT PRICE</th>
            <th className="border border-gray-600 p-3 text-center font-bold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-400 p-3">
                <div>{item.description}</div>
                {item.date && (
                  <div className="text-xs text-gray-500 mt-1 italic font-serif">
                    {format(new Date(item.date), 'MMMM dd, yyyy HH:mm')}
                  </div>
                )}
              </td>
              <td className="border border-gray-400 p-3 text-center">{item.quantity}</td>
              <td className="border border-gray-400 p-3 text-center">{data.currency} {item.unitPrice.toFixed(2)}</td>
              <td className="border border-gray-400 p-3 text-center font-medium">{data.currency} {item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Summary */}
    <div className="flex justify-end mb-8">
      <div className="w-80">
        <table className="w-full border-2 border-gray-800">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 font-medium">SUBTOTAL:</td>
              <td className="border border-gray-400 p-3 text-right">{data.currency} {data.subtotal.toFixed(2)}</td>
            </tr>
            {data.discountAmount > 0 && (
              <tr>
                <td className="border border-gray-400 p-3 font-medium">DISCOUNT:</td>
                <td className="border border-gray-400 p-3 text-right text-green-600">-{data.currency} {data.discountAmount.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td className="border border-gray-400 p-3 font-medium">TAX:</td>
              <td className="border border-gray-400 p-3 text-right">{data.currency} {data.taxAmount.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-gray-600 p-3 font-bold text-lg">TOTAL AMOUNT:</td>
              <td className="border border-gray-600 p-3 text-right font-bold text-lg">{data.currency} {data.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Terms and Notes */}
    {(data.notes || (data.paymentTerms && data.paymentTerms !== "0" && data.paymentStatus?.toLowerCase() !== "paid")) && (
      <div className="border-t-2 border-gray-800 pt-6">
        <div className="grid grid-cols-2 gap-8">
          {data.paymentTerms && data.paymentTerms !== "0" && data.paymentStatus?.toLowerCase() !== "paid" && (
            <div>
              <h4 className="font-bold text-lg mb-2 underline">PAYMENT TERMS:</h4>
              <p>{data.paymentTerms}</p>
            </div>
          )}
          {data.notes && (
            <div>
              <h4 className="font-bold text-lg mb-2 underline">NOTES:</h4>
              <p>{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Footer */}
    <div className="text-center mt-8 pt-6 border-t border-gray-400">
      <p className="text-sm text-gray-600">Thank you for your business!</p>
    </div>
  </div>
);

export const invoiceTemplates = {
  modern: {
    name: "Modern Minimalist",
    description: "Clean and professional design with blue accents",
    component: ModernTemplate,
    preview: "/api/placeholder/template-modern.png"
  },
  corporate: {
    name: "Professional Corporate",
    description: "Traditional business design with dark header",
    component: CorporateTemplate,
    preview: "/api/placeholder/template-corporate.png"
  },
  creative: {
    name: "Creative Design",
    description: "Colorful gradient design with rounded elements",
    component: CreativeTemplate,
    preview: "/api/placeholder/template-creative.png"
  },
  classic: {
    name: "Classic Traditional",
    description: "Formal traditional invoice with borders",
    component: ClassicTemplate,
    preview: "/api/placeholder/template-classic.png"
  }
};