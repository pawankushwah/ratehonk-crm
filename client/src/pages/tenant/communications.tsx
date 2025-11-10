import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { format } from 'date-fns';
import {
  MessageSquare,
  Phone,
  Mail,
  Video,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Reply,
  Forward,
  Archive,
  Star,
  Clock,
  User,
  Calendar,
  Send,
  Paperclip,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users
} from "lucide-react";

interface Communication {
  id: number;
  type: 'email' | 'phone' | 'sms' | 'meeting' | 'note';
  subject: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  attachments?: Array<{
    id: number;
    name: string;
    size: number;
    type: string;
  }>;
  tags?: string[];
}

const communicationTypes = [
  { value: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  { value: 'phone', label: 'Phone Call', icon: Phone, color: 'bg-green-100 text-green-800' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
  { value: 'meeting', label: 'Meeting', icon: Video, color: 'bg-orange-100 text-orange-800' },
  { value: 'note', label: 'Note', icon: User, color: 'bg-gray-100 text-gray-800' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const statusOptions = [
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'read', label: 'Read', color: 'bg-purple-100 text-purple-800' },
  { value: 'replied', label: 'Replied', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
];

export default function Communications() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const { data: communications, isLoading } = useQuery<Communication[]>({
    queryKey: [`/api/tenants/${tenant?.id}/communications`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch communications");
      return response.json();
    },
  });

  const { data: customers } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  const { data: leads } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  const createCommunication = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/communications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create communication');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/communications`] });
      toast({ title: "Communication logged successfully" });
      setIsComposeOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to log communication", variant: "destructive" });
    },
  });

  const filteredCommunications = communications?.filter(comm => {
    const matchesSearch = searchQuery === '' || 
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.leadName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || comm.type === selectedType;
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'starred' && comm.tags?.includes('starred')) ||
      (selectedFilter === 'urgent' && comm.priority === 'urgent') ||
      (selectedFilter === 'unread' && comm.status !== 'read');
    
    return matchesSearch && matchesType && matchesFilter;
  }) || [];

  const getCommunicationIcon = (type: string) => {
    const commType = communicationTypes.find(t => t.value === type);
    return commType ? commType.icon : MessageSquare;
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption?.color || 'bg-gray-100 text-gray-800';
  };

  const ComposeDialog = () => {
    const [formData, setFormData] = useState({
      type: 'email',
      subject: '',
      content: '',
      priority: 'medium',
      customerId: '',
      leadId: '',
      direction: 'outbound',
      status: 'sent'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createCommunication.mutate(formData);
    };

    return (
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log New Communication</DialogTitle>
            <DialogDescription>
              Record a communication with a customer or lead
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Communication Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {communicationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer (Optional)</Label>
                <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value, leadId: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(customers) && customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name || customer.firstName + ' ' + customer.lastName || `Customer ${customer.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lead">Lead (Optional)</Label>
                <Select value={formData.leadId} onValueChange={(value) => setFormData({...formData, leadId: value, customerId: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(leads) && leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.name || lead.firstName + ' ' + lead.lastName || `Lead ${lead.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject/Title</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Enter subject or communication title"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Content/Notes</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter communication details, notes, or content"
                rows={6}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCommunication.isPending}>
                {createCommunication.isPending ? 'Saving...' : 'Log Communication'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

  return (
    <Layout>
      <div className="p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Communications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track all customer communications
            </p>
          </div>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Communication
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search communications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {communicationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="starred">Starred</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communications List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Communications History
                  <Badge variant="secondary">{filteredCommunications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {filteredCommunications.map((communication) => {
                    const Icon = getCommunicationIcon(communication.type);
                    return (
                      <div
                        key={communication.id}
                        className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                          selectedCommunication?.id === communication.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => setSelectedCommunication(communication)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${communicationTypes.find(t => t.value === communication.type)?.color || 'bg-gray-100 text-gray-800'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {communication.subject}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(communication.priority)}>
                                  {communication.priority}
                                </Badge>
                                <Badge className={getStatusColor(communication.status)}>
                                  {communication.status}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                              {communication.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {communication.customerName || communication.leadName || 'No contact'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(communication.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <span>By {communication.createdBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCommunications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No communications found</p>
                      <p className="text-sm">Try adjusting your filters or log a new communication</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail View */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Communication Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCommunication ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {React.createElement(getCommunicationIcon(selectedCommunication.type), { className: "w-5 h-5" })}
                        <h3 className="font-medium">{selectedCommunication.subject}</h3>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <Badge className={getStatusColor(selectedCommunication.status)}>
                          {selectedCommunication.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Priority:</span>
                        <Badge className={getPriorityColor(selectedCommunication.priority)}>
                          {selectedCommunication.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Contact:</span>
                        <span>{selectedCommunication.customerName || selectedCommunication.leadName || 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date:</span>
                        <span>{format(new Date(selectedCommunication.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Created by:</span>
                        <span>{selectedCommunication.createdBy}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Content</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedCommunication.content}
                      </p>
                    </div>

                    {selectedCommunication.attachments && selectedCommunication.attachments.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedCommunication.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{attachment.name}</span>
                              <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-2">
                      <Button size="sm" className="w-full">
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">
                          <Forward className="w-4 h-4 mr-2" />
                          Forward
                        </Button>
                        <Button variant="outline" size="sm">
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a communication to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ComposeDialog />
      </div>
    </Layout>
  );
}