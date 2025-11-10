import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import { EstimatePreview } from "@/components/estimates/estimate-preview";
import { 
  Plus, Send, FileText, DollarSign, Calendar, Users, Trash2, 
  Download, Eye, Mail, Search, Filter, Grid, List, MoreHorizontal,
  Settings, HelpCircle, Bell, Upload, MessageCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Estimate {
  id: number;
  estimateNumber: string;
  title: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  status: string;
  subtotal: string;
  totalAmount: string;
  notes?: string;
  createdAt: Date;
  sentAt?: Date;
}

interface EstimateLineItem {
  id?: number;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export default function EstimatesNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<Estimate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: rawEstimates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/estimates"],
  });

  // Transform and filter estimates
  const estimates = rawEstimates
    .map((estimate: any) => ({
      id: estimate.id,
      estimateNumber: estimate.estimate_number || estimate.estimateNumber || `EST-${estimate.id}`,
      title: estimate.title || "Untitled Estimate",
      currency: estimate.currency || "USD",
      customerName: estimate.customer_name || estimate.customerName || "No Customer",
      customerEmail: estimate.customer_email || estimate.customerEmail || "",
      customerPhone: estimate.customer_phone || estimate.customerPhone || "",
      description: estimate.description || "",
      status: estimate.status || "draft",
      subtotal: estimate.subtotal || "0.00",
      totalAmount: estimate.total_amount || estimate.totalAmount || estimate.subtotal || "0.00",
      notes: estimate.notes,
      createdAt: new Date(estimate.created_at || estimate.createdAt || Date.now()),
      sentAt: estimate.sent_at || estimate.sentAt ? new Date(estimate.sent_at || estimate.sentAt) : undefined,
    }))
    .filter((estimate: Estimate) => 
      estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Pagination calculations
  const totalEstimates = estimates.length;
  const totalPages = Math.ceil(totalEstimates / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEstimates = estimates.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [formData, setFormData] = useState({
    title: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    description: "",
    notes: "",
    lineItems: [
      {
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: "0",
        totalPrice: "0"
      }
    ] as EstimateLineItem[]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/estimates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        description: "",
        notes: "",
        lineItems: [{ itemName: "", description: "", quantity: 1, unitPrice: "0", totalPrice: "0" }]
      });
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create estimate",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (estimateId: number) => {
      const response = await apiRequest("DELETE", `/api/estimates/${estimateId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete estimate",
        variant: "destructive",
      });
    },
  });

  // WhatsApp PDF sharing function
  const handleShareWhatsAppPDF = async (estimate: Estimate) => {
    try {
      // Create a temporary preview component for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '40px';
      
      // Generate HTML content for the estimate
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white; padding: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">RateHonk Travel Services</h1>
              <p style="color: #6b7280; margin: 4px 0;">123 Travel Lane, Suite 100</p>
              <p style="color: #6b7280; margin: 4px 0;">Travel City, TC 12345</p>
              <p style="color: #6b7280; margin: 4px 0;">(555) 123-4567</p>
              <p style="color: #6b7280; margin: 4px 0;">info@ratehonk.com</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 24px; font-weight: 600; color: #3b82f6; margin-bottom: 8px;">ESTIMATE</h2>
              <p style="color: #6b7280; margin: 4px 0;">Number: ${estimate.estimateNumber}</p>
              <p style="color: #6b7280; margin: 4px 0;">Date: ${estimate.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">ESTIMATE FOR:</h3>
              <p style="color: #374151; margin: 4px 0; font-weight: 600;">${estimate.customerName}</p>
              <p style="color: #6b7280; margin: 4px 0;">${estimate.customerEmail}</p>
              ${estimate.customerPhone ? `<p style="color: #6b7280; margin: 4px 0;">${estimate.customerPhone}</p>` : ''}
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">${estimate.title}</h3>
            ${estimate.description ? `<p style="color: #6b7280; margin-bottom: 20px;">${estimate.description}</p>` : ''}
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 600; color: #1f2937;">Total Amount:</span>
              <span style="font-size: 24px; font-weight: 700; color: #059669;">$${estimate.totalAmount}</span>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Status: </span>
              <span style="background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}</span>
            </div>
          </div>
          
          ${estimate.notes ? `
          <div style="margin-bottom: 30px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">NOTES:</h4>
            <p style="color: #6b7280; line-height: 1.6;">${estimate.notes}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Thank you for your business!</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Generate PDF using html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Clean up temporary element
      document.body.removeChild(tempDiv);
      
      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const fileName = `Estimate-${estimate.estimateNumber}.pdf`;
      
      // Check if Web Share API is supported (mainly mobile devices)
      if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: `Estimate ${estimate.estimateNumber}`,
            text: `Estimate for ${estimate.customerName} - $${estimate.totalAmount}`,
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
          });
          return;
        } catch (err) {
          // Fall through to alternative method if sharing is cancelled
        }
      }
      
      // Fallback: Download PDF and open WhatsApp with instructions
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show toast with instructions
      toast({
        title: "PDF Downloaded",
        description: "PDF has been downloaded. You can now attach it to WhatsApp manually.",
        duration: 5000,
      });
      
      // Open WhatsApp with message
      setTimeout(() => {
        const message = `Hello ${estimate.customerName}!

I'm sending you the estimate for our services.

📋 *Estimate Summary:*
• Estimate Number: ${estimate.estimateNumber}
• Title: ${estimate.title}
• Amount: $${estimate.totalAmount}
• Date: ${estimate.createdAt.toLocaleDateString()}

Please find the detailed PDF estimate attached to this message.

We look forward to working with you!

Best regards,
RateHonk Travel Services`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { itemName: "", description: "", quantity: 1, unitPrice: "0", totalPrice: "0" }
      ]
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newLineItems = [...prev.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      
      // Auto-calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? value : newLineItems[index].quantity;
        const unitPrice = field === 'unitPrice' ? value : newLineItems[index].unitPrice;
        newLineItems[index].totalPrice = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
      }
      
      return { ...prev, lineItems: newLineItems };
    });
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => 
      sum + parseFloat(item.totalPrice || "0"), 0
    );
    return {
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2)
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();
    
    const submitData = {
      ...formData,
      subtotal: totals.subtotal,
      totalAmount: totals.total,
    };
    
    createMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      sent: "default", 
      viewed: "outline",
      accepted: "default",
      rejected: "destructive"
    };
    
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      viewed: "bg-yellow-100 text-yellow-800", 
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
        •
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const totals = calculateTotals();

  return (
    <Layout>
      <div className="space-y-6 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Estimate Management</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Estimate Management</span>
              <span>›</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-medium">Estimates</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Integrate 📊📈📊
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Automate
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Estimate
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Estimates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <Card>
            <Table>
              <TableHeader className="bg-[#EEF2F6] border-b-2">
                <TableRow>
                  <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">

                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Estimate Number ▼</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Customer</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Amount</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Status</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Created</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEstimates.map((estimate) => (
                  <TableRow key={estimate.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{estimate.estimateNumber}</div>
                          <div className="text-sm text-gray-500">{estimate.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{estimate.customerName}</div>
                        <div className="text-sm text-gray-500">{estimate.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${estimate.totalAmount}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {estimate.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setPreviewEstimate(estimate)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareWhatsAppPDF(estimate)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Share PDF on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewEstimate(estimate)}>
                              <Download className="h-4 w-4 mr-2" />
                              Print & Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(estimate.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {paginatedEstimates.length === 0 && estimates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first estimate</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Estimate
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {estimates.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>of {totalEstimates} estimates</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
              <DialogDescription>
                Create a professional estimate for your customer
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Estimate Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Website Development Project"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the work or service"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.lineItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-4">
                            <Label>Item Name</Label>
                            <Input
                              value={item.itemName}
                              onChange={(e) => updateLineItem(index, 'itemName', e.target.value)}
                              placeholder="Service or product name"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label>Description</Label>
                            <Input
                              value={item.description || ''}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Brief description"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Label>Total</Label>
                            <Input
                              value={`$${item.totalPrice}`}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div className="col-span-1">
                            {formData.lineItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLineItem(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold">${totals.total}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or terms"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Estimate"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        {previewEstimate && (
          <Dialog open={!!previewEstimate} onOpenChange={() => setPreviewEstimate(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Estimate Preview - {previewEstimate.estimateNumber}</DialogTitle>
                <DialogDescription>
                  Professional estimate ready for printing or download
                </DialogDescription>
              </DialogHeader>
              <EstimatePreview 
                estimate={{
                  estimateNumber: previewEstimate.estimateNumber,
                  title: previewEstimate.title,
                  customerName: previewEstimate.customerName,
                  customerEmail: previewEstimate.customerEmail,
                  customerPhone: previewEstimate.customerPhone,
                  description: previewEstimate.description,
                  subtotal: previewEstimate.subtotal,
                  totalAmount: previewEstimate.totalAmount,
                  notes: previewEstimate.notes,
                  status: previewEstimate.status,
                  createdAt: previewEstimate.createdAt.toISOString(),
                  lineItems: []
                }} 
                companyInfo={{
                  name: "RateHonk Travel Services",
                  address: "123 Travel Lane, Suite 100\nTravel City, TC 12345",
                  phone: "(555) 123-4567",
                  email: "info@ratehonk.com"
                }}
              />
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setPreviewEstimate(null)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}