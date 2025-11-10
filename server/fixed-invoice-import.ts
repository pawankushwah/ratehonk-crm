// Fixed Invoice Import System - Complete working solution
import { simpleStorage } from "./simple-storage.js";
import XLSX from 'xlsx';

export class FixedInvoiceImporter {
  
  // Parse Excel file and extract invoice data
  static parseExcelFile(filePath: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`📊 Parsing Excel file: ${data.length} total rows`);
      
      // Extract invoices from data (skip header rows)
      const invoices = [];
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 6 && row[0] && row[5]) {
          // Column structure: Date, Type, No., Customer, Memo, Amount, Status
          const amount = parseFloat(String(row[5]).replace(/[^0-9.-]/g, '')) || 0;
          const type = row[1]?.toString() || '';
          
          // Only process Invoice types with positive amounts
          if (type.toLowerCase().includes('invoice') && amount > 0) {
            invoices.push({
              invoiceNumber: row[2]?.toString() || `IMP-${Date.now()}-${i}`,
              customerName: row[3]?.toString() || 'Unknown Customer',
              totalAmount: amount,
              subtotal: amount,
              taxAmount: 0,
              status: this.mapStatus(row[6]?.toString()),
              invoiceDate: this.parseDate(row[0]?.toString()) || new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              notes: `${type} - ${row[4] || 'Imported from Excel'}`,
              sourceFile: 'Excel Import'
            });
          }
        }
      }
      
      console.log(`📊 Extracted ${invoices.length} valid invoices`);
      return { success: true, invoices, totalRows: data.length };
      
    } catch (error) {
      console.error('❌ Excel parsing error:', error);
      return { success: false, error: error.message, invoices: [] };
    }
  }
  
  // Map status from Excel to system status
  static mapStatus(excelStatus: string): string {
    if (!excelStatus) return 'pending';
    
    const status = excelStatus.toLowerCase();
    if (status.includes('paid')) return 'paid';
    if (status.includes('overdue')) return 'overdue';
    if (status.includes('draft')) return 'draft';
    return 'pending';
  }
  
  // Parse date from various formats
  static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      
      // Fallback to Date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.log('Date parsing failed:', dateStr);
    }
    
    return null;
  }
  
  // Create invoices with proper error handling
  static async createInvoices(invoices: any[], tenantId: number) {
    const results = {
      created: [],
      errors: [],
      customers: []
    };
    
    console.log(`🚀 Creating ${invoices.length} invoices for tenant ${tenantId}`);
    
    for (let i = 0; i < invoices.length; i++) {
      const invoiceData = invoices[i];
      
      try {
        // Create or find customer
        let customerId = 1; // Default customer
        
        if (invoiceData.customerName && invoiceData.customerName !== 'Unknown Customer') {
          try {
            // Try to find existing customer first
            const existingCustomers = await simpleStorage.getCustomersByTenant(tenantId);
            const existingCustomer = existingCustomers.find(c => 
              c.name?.toLowerCase().includes(invoiceData.customerName.toLowerCase()) ||
              invoiceData.customerName.toLowerCase().includes(c.name?.toLowerCase())
            );
            
            if (existingCustomer) {
              customerId = existingCustomer.id;
              console.log(`✅ Found existing customer: ${existingCustomer.name} (ID: ${customerId})`);
            } else {
              // Create new customer
              const newCustomer = await simpleStorage.createCustomer({
                tenantId: tenantId,
                name: invoiceData.customerName,
                email: `${invoiceData.customerName.toLowerCase().replace(/\s+/g, '.')}@imported.com`,
                phone: '',
                address: '',
                city: '',
                state: '',
                country: '',
                pincode: ''
              });
              customerId = newCustomer.id;
              results.customers.push(newCustomer);
              console.log(`✅ Created new customer: ${newCustomer.name} (ID: ${customerId})`);
            }
          } catch (customerError) {
            console.log(`⚠️ Customer creation failed for ${invoiceData.customerName}, using default`);
          }
        }
        
        // Create invoice with clean data structure
        const cleanInvoiceData = {
          tenantId: tenantId,
          customerId: customerId,
          invoiceNumber: invoiceData.invoiceNumber,
          status: invoiceData.status,
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate,
          subtotal: invoiceData.subtotal,
          taxAmount: invoiceData.taxAmount,
          totalAmount: invoiceData.totalAmount,
          notes: invoiceData.notes
        };
        
        console.log(`🔧 Creating invoice ${i + 1}/${invoices.length}: ${cleanInvoiceData.invoiceNumber}`);
        
        const createdInvoice = await simpleStorage.createInvoice(cleanInvoiceData);
        results.created.push(createdInvoice);
        
        console.log(`✅ Successfully created invoice ID: ${createdInvoice.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to create invoice ${invoiceData.invoiceNumber}:`, error);
        results.errors.push({
          invoice: invoiceData,
          error: error.message
        });
      }
    }
    
    console.log(`🎉 Import completed: ${results.created.length} created, ${results.errors.length} errors, ${results.customers.length} new customers`);
    
    return results;
  }
}