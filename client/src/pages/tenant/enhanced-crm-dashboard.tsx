import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  Eye,
  Edit,
  Building2,
  MapPin,
  Tag,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  Users,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";

// Enhanced Customer interface for CRM
interface CRMCustomer {
  id: number;
  tenantId: number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  crmStatus?: string;
  lastActivity?: string;
  totalValue?: number;
  tags?: string[];
  company?: string;
  createdAt: string;
}

// CRM Status columns configuration
const CRM_STATUSES = [
  { 
    id: "new", 
    label: "New Leads", 
    color: "bg-slate-100 border-slate-300",
    textColor: "text-slate-700",
    badgeColor: "bg-slate-200 text-slate-800"
  },
  { 
    id: "contacted", 
    label: "Contacted", 
    color: "bg-blue-50 border-blue-300",
    textColor: "text-blue-700",
    badgeColor: "bg-blue-200 text-blue-800"
  },
  { 
    id: "qualified", 
    label: "Qualified", 
    color: "bg-purple-50 border-purple-300",
    textColor: "text-purple-700",
    badgeColor: "bg-purple-200 text-purple-800"
  },
  { 
    id: "proposal", 
    label: "Proposal Sent", 
    color: "bg-orange-50 border-orange-300",
    textColor: "text-orange-700",
    badgeColor: "bg-orange-200 text-orange-800"
  },
  { 
    id: "negotiation", 
    label: "Negotiation", 
    color: "bg-yellow-50 border-yellow-300",
    textColor: "text-yellow-700",
    badgeColor: "bg-yellow-200 text-yellow-800"
  },
  { 
    id: "closed-won", 
    label: "Closed Won", 
    color: "bg-green-50 border-green-300",
    textColor: "text-green-700",
    badgeColor: "bg-green-200 text-green-800"
  },
  { 
    id: "closed-lost", 
    label: "Closed Lost", 
    color: "bg-red-50 border-red-300",
    textColor: "text-red-700",
    badgeColor: "bg-red-200 text-red-800"
  }
];

// Sortable Customer Card Component
function SortableCustomerCard({ customer }: { customer: CRMCustomer }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed Customer';
  const tags = Array.isArray(customer.tags) ? customer.tags : (customer.tags ? JSON.parse(customer.tags) : []);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-move hover:shadow-lg transition-all duration-200 bg-white border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{displayName}</h3>
                {customer.company && (
                  <p className="text-xs text-gray-500 flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    {customer.company}
                  </p>
                )}
              </div>
            </div>
            {customer.totalValue && (
              <Badge variant="secondary" className="text-xs">
                ${customer.totalValue.toLocaleString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="w-3 h-3 mr-1" />
              <span className="truncate">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center text-xs text-gray-600">
                <Phone className="w-3 h-3 mr-1" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.lastActivity && (
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                <span>Last: {new Date(customer.lastActivity).toLocaleDateString()}</span>
              </div>
            )}
            {customer.notes && (
              <p className="text-xs text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded">
                {customer.notes}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Mail className="w-3 h-3" />
                </Button>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Droppable Status Column Component
function StatusColumn({ status, customers }: { status: any; customers: CRMCustomer[] }) {
  const { setNodeRef } = useDroppable({
    id: status.id,
  });

  const columnCustomers = customers.filter(customer => 
    (customer.crmStatus || 'new') === status.id
  );

  const totalValue = columnCustomers.reduce((sum, customer) => 
    sum + (customer.totalValue || 0), 0
  );

  return (
    <div className="flex-1 min-w-80">
      <Card className={`h-full ${status.color} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-sm font-semibold ${status.textColor}`}>
              {status.label}
            </CardTitle>
            <Badge className={status.badgeColor}>
              {columnCustomers.length}
            </Badge>
          </div>
          {totalValue > 0 && (
            <div className={`text-xs ${status.textColor} flex items-center`}>
              <DollarSign className="w-3 h-3 mr-1" />
              ${totalValue.toLocaleString()}
            </div>
          )}
        </CardHeader>
        <CardContent 
          ref={setNodeRef}
          className="space-y-2 min-h-[500px] max-h-[700px] overflow-y-auto"
        >
          <SortableContext
            items={columnCustomers.map(customer => customer.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnCustomers.map((customer) => (
              <SortableCustomerCard key={customer.id} customer={customer} />
            ))}
          </SortableContext>
          {columnCustomers.length === 0 && (
            <div className="text-center py-8">
              <div className={`text-4xl mb-2 ${status.textColor} opacity-30`}>
                <Users />
              </div>
              <p className={`text-sm ${status.textColor} opacity-60`}>
                No customers in this stage
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnhancedCRMDashboard() {
  const { tenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCustomer, setActiveCustomer] = useState<CRMCustomer | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch customers
  const { data: customers = [], isLoading, error } = useQuery<CRMCustomer[]>({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
  });

  // Update customer CRM status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ customerId, crmStatus }: { customerId: number; crmStatus: string }) => {
      return await apiRequest("PUT", `/api/tenants/${tenant?.id}/customers/${customerId}`, {
        crmStatus,
        lastActivity: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/customers`] });
      toast({
        title: "Customer Updated",
        description: "Customer status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update customer status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) return;

    const customerId = Number(active.id);
    const newStatus = over.id as string;
    
    // Find the customer being moved
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    // Only update if status changed
    if (customer.crmStatus !== newStatus) {
      updateStatusMutation.mutate({ customerId, crmStatus: newStatus });
    }

    setActiveCustomer(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const customerId = Number(event.active.id);
    const customer = customers.find(c => c.id === customerId);
    setActiveCustomer(customer || null);
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const name = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    return (
      name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate summary stats
  const totalCustomers = filteredCustomers.length;
  const totalPipelineValue = filteredCustomers.reduce((sum, customer) => sum + (customer.totalValue || 0), 0);
  const avgDealSize = totalCustomers > 0 ? totalPipelineValue / totalCustomers : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-red-600">Error Loading CRM Dashboard</h3>
          <p className="text-gray-600 mt-2">Please refresh the page or contact support.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Pipeline</h1>
            <p className="text-gray-600">Manage your customer relationships and sales pipeline</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold text-gray-900">${totalPipelineValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-gray-900">${avgDealSize.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCustomers > 0 ? Math.round((filteredCustomers.filter(c => c.crmStatus === 'closed-won').length / totalCustomers) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers, companies, or deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {CRM_STATUSES.map((status) => (
              <StatusColumn
                key={status.id}
                status={status}
                customers={filteredCustomers}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCustomer ? (
              <SortableCustomerCard customer={activeCustomer} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
}