import { InvoiceData } from './invoice-templates';

export const generateInvoicePDF = (invoiceData: InvoiceData, templateKey: string) => {
  const htmlContent = renderTemplateToHTML(invoiceData, templateKey);
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  }
};

const renderTemplateToHTML = (data: InvoiceData, templateKey: string): string => {
  switch (templateKey) {
    case 'modern':
      return renderModernTemplate(data);
    case 'corporate':
      return renderCorporateTemplate(data);
    case 'creative':
      return renderCreativeTemplate(data);
    case 'classic':
      return renderClassicTemplate(data);
    default:
      return renderModernTemplate(data);
  }
};

const renderModernTemplate = (data: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          min-height: 100vh;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .company-info p {
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-info h2 {
          font-size: 24px;
          font-weight: 600;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .billing-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
          background-color: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #4b5563;
        }
        
        .text-right {
          text-align: right;
        }
        
        .amount {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
        }
        
        .totals {
          margin-left: auto;
          width: 300px;
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .total-row:last-child {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          border-bottom: 2px solid #3b82f6;
          border-top: 2px solid #3b82f6;
          padding: 16px 0;
          margin-top: 12px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        
        @media print {
          body { 
            font-size: 12px; 
          }
          .invoice-container {
            padding: 20px;
            margin: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${data.companyName}</h1>
            <p>${data.companyEmail}</p>
            <p>${data.companyPhone || ''}</p>
            <p>${data.companyAddress || ''}</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
            <p><strong>Date:</strong> ${data.issueDate}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
          </div>
        </div>
        
        <div class="billing-section">
          <div class="billing-info">
            <h3>Bill To</h3>
            <p><strong>${data.customerName}</strong></p>
            <p>${data.customerEmail}</p>
            <p>${data.customerAddress || ''}</p>
          </div>
          <div class="billing-info">
            <h3>Payment Terms</h3>
            <p>${data.paymentTerms || 'Net 30'}</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right amount">${data.currency}${item.unitPrice.toFixed(2)}</td>
                <td class="text-right amount">${data.currency}${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span class="amount">${data.currency}${data.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span class="amount">${data.currency}${data.taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total:</span>
            <span class="amount">${data.currency}${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>${data.companyName} | ${data.companyEmail} | ${data.companyPhone || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const renderCorporateTemplate = (data: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #1f2937;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
        }
        
        .corporate-header {
          background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
          color: white;
          padding: 40px 30px;
        }
        
        .header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }
        
        .company-section h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        
        .invoice-section {
          text-align: right;
        }
        
        .invoice-section h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          letter-spacing: 2px;
        }
        
        .content-area {
          padding: 40px 30px;
        }
        
        .billing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 8px;
        }
        
        .corporate-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border: 1px solid #e5e7eb;
        }
        
        .corporate-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
          border-bottom: 2px solid #1e40af;
        }
        
        .corporate-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .text-right {
          text-align: right;
        }
        
        .amount {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
        }
        
        .totals-section {
          background: #f8fafc;
          padding: 24px;
          border-radius: 8px;
          margin-top: 30px;
          border-left: 4px solid #1e40af;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 16px;
        }
        
        .total-row:last-child {
          font-size: 20px;
          font-weight: 700;
          color: #1e40af;
          border-top: 2px solid #1e40af;
          padding-top: 16px;
          margin-top: 12px;
        }
        
        @media print {
          body { font-size: 12px; }
          .invoice-container { margin: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="corporate-header">
          <div class="header-grid">
            <div class="company-section">
              <h1>${data.companyName}</h1>
              <p>${data.companyEmail}</p>
              <p>${data.companyPhone || ''}</p>
              <p>${data.companyAddress || ''}</p>
            </div>
            <div class="invoice-section">
              <h2>INVOICE</h2>
              <p><strong>Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Date:</strong> ${data.issueDate}</p>
              <p><strong>Due:</strong> ${data.dueDate}</p>
            </div>
          </div>
        </div>
        
        <div class="content-area">
          <div class="billing-grid">
            <div class="billing-info">
              <div class="section-title">Bill To</div>
              <p><strong>${data.customerName}</strong></p>
              <p>${data.customerEmail}</p>
              <p>${data.customerAddress || ''}</p>
            </div>
            <div class="billing-info">
              <div class="section-title">Payment Terms</div>
              <p>${data.paymentTerms || 'Net 30'}</p>
            </div>
          </div>
          
          <table class="corporate-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right amount">${data.currency}${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right amount">${data.currency}${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span class="amount">${data.currency}${data.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span class="amount">${data.currency}${data.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Total:</span>
              <span class="amount">${data.currency}${data.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const renderCreativeTemplate = (data: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #1f2937;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          position: relative;
        }
        
        .creative-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          position: relative;
          overflow: hidden;
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        .company-logo {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          margin-bottom: 20px;
        }
        
        .company-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .content-section {
          padding: 30px;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 40px;
        }
        
        .detail-group h3 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .creative-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .creative-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }
        
        .creative-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .amount {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
        }
        
        .total-section {
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .total-row.final {
          font-weight: 700;
          font-size: 20px;
          color: #667eea;
          border-top: 2px solid #667eea;
          padding-top: 12px;
          margin-top: 12px;
        }
        
        @media print {
          body { font-size: 12px; }
          .invoice-container { margin: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="creative-header">
          <div class="header-content">
            <div class="company-logo">${data.companyName.charAt(0)}</div>
            <div class="company-name">${data.companyName}</div>
            <div class="invoice-title">Invoice #${data.invoiceNumber}</div>
          </div>
        </div>
        
        <div class="content-section">
          <div class="invoice-details">
            <div class="detail-group">
              <h3>Bill To</h3>
              <p><strong>${data.customerName}</strong></p>
              <p>${data.customerEmail}</p>
              <p>${data.customerAddress || ''}</p>
            </div>
            
            <div class="detail-group">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${data.issueDate}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Terms:</strong> ${data.paymentTerms || 'Net 30'}</p>
            </div>
          </div>
          
          <table class="creative-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td class="amount">${data.currency}${item.unitPrice.toFixed(2)}</td>
                  <td class="amount">${data.currency}${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span class="amount">${data.currency}${data.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span class="amount">${data.currency}${data.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total:</span>
              <span class="amount">${data.currency}${data.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const renderClassicTemplate = (data: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #2d3748;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          min-height: 100vh;
          border: 2px solid #2d3748;
        }
        
        .classic-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px double #2d3748;
        }
        
        .company-name {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin: 40px 0;
        }
        
        .billing-box {
          width: 45%;
          padding: 20px;
          border: 1px solid #2d3748;
          background: #f7fafc;
        }
        
        .billing-box h3 {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #2d3748;
          padding-bottom: 6px;
        }
        
        .classic-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border: 2px solid #2d3748;
        }
        
        .classic-table th {
          background: #2d3748;
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
        }
        
        .classic-table td {
          padding: 16px;
          border-bottom: 1px solid #2d3748;
          color: #4a5568;
        }
        
        .text-right {
          text-align: right;
        }
        
        .amount {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
        }
        
        .totals-box {
          width: 350px;
          margin: 30px 0 30px auto;
          border: 2px solid #2d3748;
          background: #f7fafc;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 16px;
        }
        
        .total-row:last-child {
          background: #2d3748;
          color: white;
          font-size: 20px;
          font-weight: 700;
          border-bottom: none;
        }
        
        @media print {
          body { font-size: 12px; }
          .invoice-container { padding: 20px; margin: 0; border: 1px solid #2d3748; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="classic-header">
          <div class="company-name">${data.companyName}</div>
          <div class="company-details">
            ${data.companyEmail} | ${data.companyPhone || ''}<br>
            ${data.companyAddress || ''}
          </div>
          <div class="invoice-title">Invoice</div>
          <div class="invoice-number"># ${data.invoiceNumber}</div>
        </div>
        
        <div class="billing-section">
          <div class="billing-box">
            <h3>Bill To</h3>
            <p><strong>${data.customerName}</strong></p>
            <p>${data.customerEmail}</p>
            <p>${data.customerAddress || ''}</p>
          </div>
          <div class="billing-box">
            <h3>Invoice Details</h3>
            <p><strong>Date:</strong> ${data.issueDate}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p><strong>Terms:</strong> ${data.paymentTerms || 'Net 30'}</p>
          </div>
        </div>
        
        <table class="classic-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right amount">${data.currency}${item.unitPrice.toFixed(2)}</td>
                <td class="text-right amount">${data.currency}${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span class="amount">${data.currency}${data.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span class="amount">${data.currency}${data.taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total Amount Due:</span>
            <span class="amount">${data.currency}${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="classic-footer">
          <p>Thank you for your esteemed patronage.</p>
          <p>${data.companyName} | ${data.companyEmail} | ${data.companyPhone || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};