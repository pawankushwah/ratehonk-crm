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
  User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";

// Enhanced Customer interface for CRM
interface CRMCustomer {
  id: number;
  tenantId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  notes?: string;
  status: string;
  crmStatus: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  lastActivity?: string;
  totalValue?: number;
  tags?: string[];
  company?: string;
  createdAt: string;
}

// CRM Status Configuration
const CRM_STATUSES = [
  { 
    id: 'new', 
    label: 'New Leads', 
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    headerColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  { 
    id: 'contacted', 
    label: 'Contacted', 
    color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
    headerColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  { 
    id: 'qualified', 
    label: 'Qualified', 
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800',
    headerColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  { 
    id: 'proposal', 
    label: 'Proposal Sent', 
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
    headerColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300'
  },
  { 
    id: 'negotiation', 
    label: 'Negotiation', 
    color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800',
    headerColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-700 dark:text-indigo-300'
  },
  { 
    id: 'closed-won', 
    label: 'Closed Won', 
    color: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
    headerColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300'
  },
  { 
    id: 'closed-lost', 
    label: 'Closed Lost', 
    color: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
    headerColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300'
  }
];

// Customer Card Component with drag functionality
interface CustomerCardProps {
  customer: CRMCustomer;
  isDragging?: boolean;
}

function CustomerCard({ customer, isDragging = false }: CustomerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-lg p-4 mb-3 cursor-move hover:shadow-md transition-all duration-200
        ${isDragging || isSortableDragging ? 'shadow-lg scale-105' : ''}
      `}
    >
      {/* Customer Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(customer.firstName, customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {customer.firstName} {customer.lastName}
            </h3>
            {customer.company && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Building2 className="h-3 w-3 mr-1" />
                {customer.company}
              </p>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Mail className="h-3 w-3 mr-2" />
          <span className="truncate">{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-3 w-3 mr-2" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3 mr-2" />
            <span>{customer.city}, {customer.state}</span>
          </div>
        )}
      </div>

      {/* Value and Last Activity */}
      <div className="flex items-center justify-between mb-3">
        {customer.totalValue && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Value: </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              ${customer.totalValue.toLocaleString()}
            </span>
          </div>
        )}
        
        {customer.lastActivity && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>{new Date(customer.lastActivity).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {customer.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
          {customer.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              +{customer.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Notes Preview */}
      {customer.notes && (
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
          <div className="line-clamp-2">{customer.notes}</div>
        </div>
      )}
    </div>
  );
}

// Droppable Column Component
interface KanbanColumnProps {
  status: typeof CRM_STATUSES[0];
  customers: CRMCustomer[];
  onAddCustomer: (status: string) => void;
}

function KanbanColumn({ status, customers, onAddCustomer }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-80 ${status.color} rounded-lg border-2 border-dashed ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`${status.headerColor} p-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold ${status.textColor}`}>
              {status.label}
            </h3>
            <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
              {customers.length}
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onAddCustomer(status.id)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
        <SortableContext items={customers.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </SortableContext>
        
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No customers in this stage</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onAddCustomer(status.id)}
              className="mt-2"
            >
              Add Customer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRMDashboard() {
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeId, setActiveId] = useState<number | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch customers with CRM data
  const { data: rawCustomers = [], isLoading } = useQuery<CRMCustomer[]>({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      // Transform basic customers to CRM customers with random CRM statuses for demo
      return data.map((customer: any) => ({
        ...customer,
        crmStatus: customer.crmStatus || ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'][Math.floor(Math.random() * 7)],
        lastActivity: customer.lastActivity || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalValue: customer.totalValue || Math.floor(Math.random() * 50000) + 5000,
        tags: customer.tags || ['travel', 'family', 'business'].slice(0, Math.floor(Math.random() * 3) + 1),
        company: customer.company || (Math.random() > 0.5 ? `Company ${Math.floor(Math.random() * 100)}` : undefined),
      }));
    },
  });

  // Update customer status mutation
  const updateCustomerStatusMutation = useMutation({
    mutationFn: async ({ customerId, newStatus }: { customerId: number; newStatus: string }) => {
      return apiRequest("PATCH", `/api/tenants/${tenant?.id}/customers/${customerId}`, {
        crmStatus: newStatus,
        lastActivity: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/customers`] });
      toast({
        title: "Success",
        description: "Customer status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update customer status",
        variant: "destructive",
      });
    },
  });

  // Filter customers based on search and filter
  const filteredCustomers = rawCustomers.filter(customer => {
    const matchesSearch = searchTerm === "" || 
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === "all" || customer.crmStatus === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Group customers by CRM status
  const customersByStatus = CRM_STATUSES.reduce((acc, status) => {
    acc[status.id] = filteredCustomers.filter(customer => customer.crmStatus === status.id);
    return acc;
  }, {} as Record<string, CRMCustomer[]>);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle dragging over columns
    const activeCustomerId = active.id as number;
    const overColumnId = over.id as string;
    
    // Check if we're dropping on a column vs a customer
    if (CRM_STATUSES.find(status => status.id === overColumnId)) {
      // We're over a column, that's valid
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const customerId = active.id as number;
    const newStatusId = over.id as string;

    // Find the customer and current status
    const customer = rawCustomers.find(c => c.id === customerId);
    if (!customer) return;

    // Only update if status actually changed and it's a valid status
    if (customer.crmStatus !== newStatusId && CRM_STATUSES.find(s => s.id === newStatusId)) {
      updateCustomerStatusMutation.mutate({ 
        customerId, 
        newStatus: newStatusId 
      });
    }
  };

  const handleAddCustomer = (status: string) => {
    // TODO: Open customer creation modal with pre-selected status
    toast({
      title: "Feature Coming Soon",
      description: "Customer creation modal will be implemented",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                CRM Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your customer pipeline with drag-and-drop simplicity
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              {/* Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Statuses</option>
                {CRM_STATUSES.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-7 gap-4 mt-6">
            {CRM_STATUSES.map((status) => (
              <Card key={status.id} className={status.color}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${status.textColor}`}>
                      {customersByStatus[status.id]?.length || 0}
                    </div>
                    <div className={`text-sm ${status.textColor} opacity-70`}>
                      {status.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 overflow-x-auto pb-6">
            {CRM_STATUSES.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                customers={customersByStatus[status.id] || []}
                onAddCustomer={handleAddCustomer}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <CustomerCard
                customer={rawCustomers.find(c => c.id === activeId)!}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
}