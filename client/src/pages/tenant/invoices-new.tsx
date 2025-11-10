import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { invoiceApi } from '@/lib/invoice-api';
import { 
  Plus, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Users, 
  Clock, 
  Edit, 
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number?: string;
  invoiceNumber?: string;
  customer_name?: string;
  customerName?: string;
  total_amount?: number;
  totalAmount?: number;
  status: string;
  invoice_date?: string;
  invoiceDate?: string;
  notes?: string;
}

interface InvoiceStats {
  totalCount: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount?: number;
  draftCount?: number;
}

const InvoicesNewPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    customerName: '',
    totalAmount: '',
    status: 'pending',
    notes: ''
  });

  // Invoice statistics query
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useQuery<InvoiceStats>({
    queryKey: ['invoice-stats'],
    queryFn: invoiceApi.getInvoiceStats,
    retry: 2,
    staleTime: 30000
  });

  // Invoices list query  
  const { 
    data: invoices = [], 
    isLoading: invoicesLoading, 
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getInvoices,
    retry: 2,
    staleTime: 30000
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      
      // Reset form
      setFormData({
        invoiceNumber: `INV-${Date.now()}`,
        customerName: '',
        totalAmount: '',
        status: 'pending',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    }
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => 
      invoiceApi.updateInvoice(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    }
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice", 
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      invoiceNumber: formData.invoiceNumber,
      customerName: formData.customerName,
      totalAmount: parseFloat(formData.totalAmount),
      status: formData.status,
      notes: formData.notes,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteInvoice = useCallback((invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(invoiceId);
    }
  }, [deleteMutation]);

  const handleTestCreate = () => {
    const testData = {
      invoiceNumber: `TEST-${Date.now()}`,
      customerName: 'Test Customer',
      totalAmount: 299.99,
      status: 'pending',
      notes: 'Test invoice created by system'
    };
    
    createMutation.mutate(testData);
  };

  const refreshAll = () => {
    refetchStats();
    refetchInvoices();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and track your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshAll} 
            variant="outline"
            disabled={statsLoading || invoicesLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleTestCreate} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Test Create
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {(statsError || invoicesError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>
                {statsError ? `Stats Error: ${statsError.message}` : ''}
                {statsError && invoicesError ? ' | ' : ''}
                {invoicesError ? `Invoices Error: ${invoicesError.message}` : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.totalCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : formatCurrency(stats?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.paidCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.pendingCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="INV-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Customer Name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Amount ($) *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  placeholder="100.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Invoice
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setFormData({
                  invoiceNumber: `INV-${Date.now()}`,
                  customerName: '',
                  totalAmount: '',
                  status: 'pending',
                  notes: ''
                })}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice List ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm">Create your first invoice using the form above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {invoice.invoice_number || invoice.invoiceNumber}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {invoice.customer_name || invoice.customerName} - {' '}
                      {formatCurrency(invoice.total_amount || invoice.totalAmount || 0)}
                    </p>
                    {(invoice.notes) && (
                      <p className="text-sm text-gray-500 mt-1">{invoice.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Edit Invoice",
                          description: `Edit functionality for invoice ${invoice.id} would open here`,
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesNewPage;