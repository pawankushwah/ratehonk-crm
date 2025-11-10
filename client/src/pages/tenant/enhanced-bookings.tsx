import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar, Users, Edit, Eye, FileText, IndianRupee, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import type { Booking } from "@/lib/types";

const bookingStatuses = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800" },
];

const paymentStatuses = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "partial", label: "Partial", color: "bg-orange-100 text-orange-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
];

export default function EnhancedBookings() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  // Fetch packages for dropdown
  const { data: packages = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch packages");
      return response.json();
    },
  });

  const { data: bookings = [], isLoading, error } = useQuery<Booking[]>({
    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Bookings API Error:', response.status, errorData);
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      return response.json();
    },
  });

  const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
    const statuses = type === 'booking' ? bookingStatuses : paymentStatuses;
    const statusConfig = statuses.find(s => s.value === status);
    return statusConfig ? statusConfig : { color: "bg-gray-100 text-gray-800", label: status };
  };

  // Column definitions for the enhanced table
  const bookingColumns: TableColumn<Booking>[] = [
    {
      key: 'bookingNumber',
      label: 'Booking #',
      sortable: true,
      render: (value, booking) => (
        <div className="font-medium">
          {value || `BK-${booking.id}`}
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (customerName, booking) => (
        <div className="flex flex-col">
          <div className="font-medium">
            {customerName || customers.find(c => c.id === booking.customerId)?.name || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Mail className="h-3 w-3 mr-1" />
            {booking.customerEmail || customers.find(c => c.id === booking.customerId)?.email || ''}
          </div>
        </div>
      )
    },
    {
      key: 'packageName',
      label: 'Package',
      sortable: true,
      render: (packageName, booking) => (
        <div className="flex flex-col">
          <div className="font-medium">
            {packageName || packages.find(p => p.id === booking.packageId)?.name || 'Custom'}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {booking.packageDestination || packages.find(p => p.id === booking.packageId)?.destination || ''}
          </div>
        </div>
      )
    },
    {
      key: 'travelDate',
      label: 'Travel Date',
      sortable: true,
      render: (travelDate) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>{travelDate ? new Date(travelDate).toLocaleDateString() : '-'}</span>
        </div>
      )
    },
    {
      key: 'travelers',
      label: 'Travelers',
      sortable: true,
      render: (travelers) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span>{travelers || 0}</span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (totalAmount) => (
        <div className="flex items-center font-semibold">
          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
          <span>{totalAmount ? parseFloat(totalAmount).toLocaleString() : '0'}</span>
        </div>
      )
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      sortable: true,
      render: (amountPaid) => (
        <div className="flex items-center font-semibold text-green-600">
          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
          <span>{amountPaid ? parseFloat(amountPaid).toLocaleString() : '0'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => {
        const statusConfig = getStatusBadge(status, 'booking');
        return (
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        );
      }
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: true,
      render: (paymentStatus) => {
        const statusConfig = getStatusBadge(paymentStatus, 'payment');
        return (
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (_, booking) => (
        <div className="flex justify-end space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedBooking(booking);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedBooking(booking);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={async () => {
              try {
                const token = auth.getToken();
                const response = await fetch(`/api/tenants/${tenant?.id}/bookings/${booking.id}/create-invoice`, {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                });
                
                if (response.ok) {
                  const result = await response.json();
                  toast({
                    title: "Success",
                    description: result.updated ? "Invoice updated successfully" : "Invoice created successfully",
                  });
                  queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/invoices`] });
                } else {
                  throw new Error('Failed to create/update invoice');
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to create/update invoice",
                  variant: "destructive",
                });
              }
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filter bookings based on search term and status
  const filteredBookings = bookings.filter(booking => {
    const searchableText = (
      (booking.bookingNumber || `BK-${booking.id}`) + ' ' +
      (booking.customerName || '') + ' ' +
      (booking.customerEmail || '') + ' ' +
      (booking.packageName || '') + ' ' +
      (booking.packageDestination || '')
    ).toLowerCase();
    
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mutation for creating new booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/bookings`] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleCreateBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bookingData = {
      customerId: parseInt(formData.get('customerId') as string),
      packageId: parseInt(formData.get('packageId') as string),
      bookingNumber: `BK${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      travelDate: formData.get('travelDate') as string,
      travelers: parseInt(formData.get('travelers') as string),
      totalAmount: formData.get('totalAmount') as string,
      amountPaid: formData.get('amountPaid') as string || '0.00',
      paymentType: formData.get('paymentType') as string || 'partial',
      status: formData.get('status') as string || 'pending',
      paymentStatus: formData.get('paymentStatus') as string || 'pending',
      specialRequests: formData.get('specialRequests') as string || null,
    };

    createBookingMutation.mutate(bookingData);
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 w-full">
          <Card className="border-red-200">
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️ Error Loading Bookings</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to load bookings data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message || "There was an error loading the bookings. Please try again."}
              </p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/bookings`] })}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage travel bookings and reservations ({bookings.length} total)
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select name="customerId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName} {customer.lastName} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageId">Travel Package</Label>
                    <Select name="packageId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.name} - {pkg.destination} (₹{pkg.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelDate">Travel Date</Label>
                  <Input
                    id="travelDate"
                    name="travelDate"
                    type="date"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="travelers">Number of Travelers</Label>
                    <Input
                      id="travelers"
                      name="travelers"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="15000.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                    <Input
                      id="amountPaid"
                      name="amountPaid"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount paid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select name="paymentType" defaultValue="partial">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Payment</SelectItem>
                        <SelectItem value="partial">Partial Payment</SelectItem>
                        <SelectItem value="advance">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Booking Status</Label>
                    <Select name="status" defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking status" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select name="paymentStatus" defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    name="specialRequests"
                    placeholder="Enter any special requests..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookings by customer, booking number, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {bookingStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Enhanced Table with Pagination and Sorting */}
        <EnhancedTable
          data={filteredBookings}
          columns={bookingColumns}
          searchTerm={searchTerm}
          showPagination={true}
          pageSize={10}
          emptyMessage={
            searchTerm || statusFilter !== "all" 
              ? "No bookings match your search criteria." 
              : "No bookings found. Create your first booking to get started."
          }
          isLoading={isLoading}
        />

        {/* View Booking Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Booking ID</Label>
                    <p className="text-lg">{selectedBooking.bookingNumber || `BK-${selectedBooking.id}`}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <Badge className={getStatusBadge(selectedBooking.status, 'booking').color}>
                      {getStatusBadge(selectedBooking.status, 'booking').label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Customer</Label>
                    <p>{selectedBooking.customerName || customers.find((c: any) => c.id === selectedBooking.customerId)?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Package</Label>
                    <p>{selectedBooking.packageName || packages.find((p: any) => p.id === selectedBooking.packageId)?.name || 'Custom'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Travel Date</Label>
                    <p>{selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Number of Travelers</Label>
                    <p>{selectedBooking.travelers || 0}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Created Date</Label>
                    <p>{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Payment Type</Label>
                    <p>{selectedBooking.paymentType || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Payment Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Total Amount</Label>
                      <p className="text-lg font-semibold">₹{selectedBooking.totalAmount ? parseFloat(selectedBooking.totalAmount).toLocaleString() : '0'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Amount Paid</Label>
                      <p className="text-lg font-semibold text-green-600">₹{selectedBooking.amountPaid ? parseFloat(selectedBooking.amountPaid).toLocaleString() : '0'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Balance Due</Label>
                      <p className="text-lg font-semibold text-red-600">
                        ₹{((parseFloat(selectedBooking.totalAmount || '0') - parseFloat(selectedBooking.amountPaid || '0'))).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Payment Progress</span>
                      <span>{selectedBooking.totalAmount > 0 ? Math.round((parseFloat(selectedBooking.amountPaid || '0') / parseFloat(selectedBooking.totalAmount)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${selectedBooking.totalAmount > 0 ? Math.min((parseFloat(selectedBooking.amountPaid || '0') / parseFloat(selectedBooking.totalAmount)) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <Label className="font-medium">Payment Status</Label>
                    <Badge className={`ml-2 ${getStatusBadge(selectedBooking.paymentStatus, 'payment').color}`}>
                      {getStatusBadge(selectedBooking.paymentStatus, 'payment').label}
                    </Badge>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Label className="font-semibold">Special Requests</Label>
                    <p className="mt-2 text-sm">{selectedBooking.specialRequests}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}