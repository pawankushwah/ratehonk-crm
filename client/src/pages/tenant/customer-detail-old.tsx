import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Settings,
  HelpCircle,
  Bell,
  Plus,
  Phone,
  Mail,
  FileText,
  Folder,
  Receipt,
  MessageCircle,
  MoreHorizontal,
  User,
  MapPin,
  Globe,
  Calendar,
  Activity,
  PhoneCall,
  File,
  CreditCard,
} from "lucide-react";
import { FaYoutube, FaLinkedin, FaFacebook } from "react-icons/fa";
import { useAuth } from "@/components/auth/auth-provider";
import { directCustomersApi } from "@/lib/direct-customers-api";
import type { Customer } from "../../../shared/schema";
import ActivityTable from "@/customerTable/ActivityTable";
import BookingTable from "@/customerTable/BookingTable";
import CallTable from "@/customerTable/CallTable";
import EmailTable from "@/customerTable/EmailTable";
import FilesDocumentsTable from "@/customerTable/FilesDocumentsTable";

const tabs = [
  { id: "activity", label: "Activity", icon: Activity },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "call", label: "Call", icon: PhoneCall },
  { id: "email", label: "Email", icon: Mail },
  { id: "files", label: "Files & Documents", icon: Folder },
  { id: "invoice", label: "Invoice", icon: Receipt },
  { id: "whatsapp", label: "", icon: MessageCircle, isIcon: true },
  { id: "more", label: "", icon: MoreHorizontal, isIcon: true },
];


const activities = [
  {
    id: 1,
    type: "call",
    title: "Lorem ipsum dolor sit amet",
    date: "August 14, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    focus: "Focus",
  },
  {
    id: 2,
    type: "note",
    title: "Lorem ipsum dolor sit amet",
    date: "August 14, 2025", 
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: 3,
    type: "call",
    title: "Lorem ipsum dolor sit amet",
    date: "August 14, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: 4,
    type: "note", 
    title: "Lorem ipsum dolor sit amet",
    date: "August 14, 2025",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export default function CustomerDetail() {
  const { customerId } = useParams();
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("activity");
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(true);
  const [organizationDetailsOpen, setOrganizationDetailsOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  // Fetch customer details
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: [`customer-detail-${customerId}`],
    enabled: !!customerId && !!tenant?.id,
    queryFn: async () => {
      const result = await directCustomersApi.getCustomers(tenant?.id!);
      return result.find((c: Customer) => c.id === parseInt(customerId!));
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 bg-[#f1f4f9] p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-2">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="flex-1 bg-[#f1f4f9] p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-2">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Customer not found</h1>
              <Link href="/customers">
                <Button>Back to Customers</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName = customer.name || 'Unknown';

  return (
    <Layout>
      <div className="flex-1 bg-[#f1f4f9] p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-2 my-2">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link href="/customers" className="bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200">
                Customer
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md">{displayName}</span>
               <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {/* <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 ml-1" /> */}
                  </div>
            </div>

            {/* Customer Profile Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{displayName}</h2>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 ml-1" />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mt-2">$2000</p>
                </div>
              </div> */}
              
              {/* <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm lg:text-base">
                  Won
                </Button>
                <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-sm lg:text-base">
                  Lost
                </Button>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm lg:text-base">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Create Lead
                </Button>
              </div> */}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row">
            {/* Left Sidebar */}
            <div className="w-full lg:w-80 lg:border-r border-gray-200 bg-gray-50">
              {/* Customer Details */}
              <div className="p-4">
                <Collapsible open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <span className="font-medium text-gray-900">Customer Revenue</span>
                    {customerDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-4">
                      
                        <div>
                          <h3 className="font-medium text-gray-900">Earning</h3>
                          <p className="text-sm text-gray-500">$2,000</p>
                        </div>
                        {/* <Button variant="ghost" size="icon" className="ml-auto">
                          <Phone className="h-4 w-4" />
                        </Button> */}
                      </div>
                      
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="p-4">
                <Collapsible open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <span className="font-medium text-gray-900">Customer Details</span>
                    {customerDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{displayName}</h3>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Position</span>
                          <span className="text-gray-900">CMO</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address</span>
                          <span className="text-gray-900">Indore, M.P.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone No.</span>
                          <span className="text-gray-900">{customer.phone || '+91 78981 64395'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email</span>
                          <span className="text-gray-900">{customer.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GSTIN</span>
                          <span className="text-gray-900">ABCD12345678</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member Since</span>
                          <span className="text-gray-900">12 Oct 2024</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <FaYoutube className="h-5 w-5 text-red-600" />
                        <FaLinkedin className="h-5 w-5 text-blue-600" />
                        <FaFacebook className="h-5 w-5 text-blue-800" />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Organization Details */}
              <div className="px-4 pb-4">
                <Collapsible open={organizationDetailsOpen} onOpenChange={setOrganizationDetailsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <span className="font-medium text-gray-900">Organization Details</span>
                    {organizationDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">W</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Wint Wealth</h3>
                          <p className="text-sm text-gray-500">Wintwealth.com</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Website</span>
                          <span className="text-gray-900">www.wintwealth.com</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address</span>
                          <span className="text-gray-900">Indore, M.P.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone No.</span>
                          <span className="text-gray-900">+91 78981 64395</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email</span>
                          <span className="text-gray-900">sales@wintwealth.com</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GSTIN</span>
                          <span className="text-gray-900">ABCD12345678</span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Description */}
              <div className="px-4 pb-4">
                <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <span className="font-medium text-gray-900">Description</span>
                    {descriptionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-3">Add Notes</p>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Notes
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-3 sm:p-6">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      {tab.label && <span className="hidden sm:inline">{tab.label}</span>}
                    </button>
                  ))}
                </div>
              </div>



              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === 'activity' && (
                  <ActivityTable 
                    customerId={customerId}
                    customerEmail={customer.email || undefined}
                    customerPhone={customer.phone || undefined}
                    customerName={displayName}
                  />
                )}
                
                {activeTab === 'bookings' && (
                  <BookingTable 
                    customerId={customerId}
                    customerEmail={customer.email || undefined}
                    customerPhone={customer.phone || undefined}
                    customerName={displayName}
                  />
                )}
                
                {activeTab === 'call' && (
                  <CallTable 
                    customerId={customerId}
                    customerEmail={customer.email || undefined}
                    customerPhone={customer.phone || undefined}
                    customerName={displayName}
                  />
                )}
                
                {activeTab === 'email' && (
                  <EmailTable 
                    customerId={customerId}
                    customerEmail={customer.email || undefined}
                    customerPhone={customer.phone || undefined}
                    customerName={displayName}
                  />
                )}
                
                {activeTab === 'files' && (
                  <FilesDocumentsTable customerId={customerId} />
                )}
                
                {activeTab === 'invoice' && (
                  <Card className="border border-gray-200">
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-3">No invoices found for this customer</p>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add invoice
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}