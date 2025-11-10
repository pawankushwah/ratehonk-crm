// Client-side file parsing utilities for multi-format invoice import

export async function parseInvoiceFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  console.log(`📄 Parsing ${fileExtension} file: ${file.name}`);
  
  switch (fileExtension) {
    case 'csv':
      return await parseCsvFile(file);
    case 'xml':
      return await parseXmlFile(file);
    case 'xls':
    case 'xlsx':
      // For Excel files, we'll still need server-side processing
      throw new Error('Excel files require server-side processing. Please try CSV or XML format.');
    default:
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: .csv, .xml`);
  }
}

async function parseCsvFile(file: File): Promise<any[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  console.log(`📄 CSV parsed: ${data.length} rows`);
  return data;
}

async function parseXmlFile(file: File): Promise<any[]> {
  const text = await file.text();
  
  // Simple XML parsing for invoice data
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format');
  }
  
  const invoices = xmlDoc.querySelectorAll('invoice');
  const data = [];
  
  for (let i = 0; i < invoices.length; i++) {
    const invoice = invoices[i];
    const invoiceData: any = {};
    
    // Extract common fields
    const getElementText = (tagName: string) => {
      const element = invoice.querySelector(tagName);
      return element ? element.textContent?.trim() || '' : '';
    };
    
    invoiceData.number = getElementText('number') || getElementText('id') || getElementText('invoice_number');
    invoiceData.customer_name = getElementText('customer_name') || getElementText('customer') || getElementText('client');
    invoiceData.customer_email = getElementText('customer_email') || getElementText('email');
    invoiceData.total_amount = getElementText('total_amount') || getElementText('amount') || getElementText('total');
    invoiceData.issue_date = getElementText('issue_date') || getElementText('date') || getElementText('created_date');
    invoiceData.due_date = getElementText('due_date') || getElementText('payment_due');
    invoiceData.status = getElementText('status') || getElementText('payment_status');
    invoiceData.currency = getElementText('currency') || 'USD';
    invoiceData.notes = getElementText('notes') || getElementText('description');
    
    data.push(invoiceData);
  }
  
  console.log(`🔖 XML parsed: ${data.length} invoices`);
  return data;
}

export function processInvoiceData(parsedData: any[], existingCustomers: any[]): any[] {
  const processedInvoices = [];
  
  for (const row of parsedData) {
    const invoice: any = {};
    
    // Extract invoice number
    invoice.invoiceNumber = extractField(row, [
      'invoice_number', 'number', 'id', 'invoice_id', 'invoice_no'
    ]);
    
    // Extract customer name
    invoice.customerName = extractField(row, [
      'customer_name', 'customer', 'client_name', 'client', 'name'
    ]);
    
    // Extract customer email
    invoice.customerEmail = extractField(row, [
      'customer_email', 'email', 'client_email'
    ]);
    
    // Extract amount
    const amountStr = extractField(row, [
      'total_amount', 'amount', 'total', 'price', 'value'
    ]);
    invoice.totalAmount = parseFloat(amountStr.replace(/[,$]/g, '')) || 0;
    
    // Extract dates
    invoice.issueDate = extractField(row, [
      'issue_date', 'date', 'created_date', 'invoice_date'
    ]);
    
    invoice.dueDate = extractField(row, [
      'due_date', 'payment_due', 'due'
    ]);
    
    // Extract status
    invoice.status = extractField(row, [
      'status', 'payment_status', 'state'
    ]) || 'pending';
    
    // Extract currency
    invoice.currency = extractField(row, [
      'currency', 'curr'
    ]) || 'USD';
    
    // Extract notes
    invoice.notes = extractField(row, [
      'notes', 'description', 'memo', 'comments'
    ]);
    
    // Customer matching
    if (invoice.customerName && existingCustomers) {
      const match = findCustomerMatch(invoice.customerName, existingCustomers);
      invoice.customerMatch = match || null;
      invoice.customerId = match?.id || null;
    }
    
    // Set default action
    invoice.action = 'create';
    
    // Only add if we have essential data
    if (invoice.invoiceNumber || invoice.customerName || invoice.totalAmount > 0) {
      console.log("📄 Processing invoice:", invoice);
      processedInvoices.push(invoice);
    }
  }
  
  return processedInvoices;
}

function extractField(row: any, patterns: string[]): string {
  for (const pattern of patterns) {
    const normalizedKey = pattern.toLowerCase().replace(/\s+/g, '_');
    if (row[normalizedKey] || row[pattern]) {
      return String(row[normalizedKey] || row[pattern]).trim();
    }
  }
  return '';
}

function findCustomerMatch(customerName: string, existingCustomers: any[]): any {
  if (!customerName || !existingCustomers) return null;
  
  const normalizedName = customerName.toLowerCase().trim();
  
  // Exact match
  let match = existingCustomers.find(customer => 
    customer.name && customer.name.toLowerCase().trim() === normalizedName
  );
  
  // Partial match
  if (!match) {
    match = existingCustomers.find(customer => 
      customer.name && (
        customer.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(customer.name.toLowerCase())
      )
    );
  }
  
  return match || null;
}