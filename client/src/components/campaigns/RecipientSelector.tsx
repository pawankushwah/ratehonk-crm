import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, User, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Recipient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: "customer" | "lead";
}

interface RecipientSelectorProps {
  selectedRecipients: Recipient[];
  onSelectionChange: (recipients: Recipient[]) => void;
  channel: "email" | "sms" | "whatsapp" | "multi_channel";
}

export function RecipientSelector({
  selectedRecipients,
  onSelectionChange,
  channel,
}: RecipientSelectorProps) {
  const { tenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"customers" | "leads">("customers");

  // Fetch customers (use apiRequest so auth token is sent)
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/customers`);
      const data = await response.json();
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    enabled: !!tenant?.id && activeTab === "customers",
  });

  // Fetch leads (use apiRequest so auth token is sent)
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/leads`);
      const data = await response.json();
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    enabled: !!tenant?.id && activeTab === "leads",
  });

  const currentList = activeTab === "customers" ? customers : leads;

  const filteredList = currentList.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    const name = (item.name || item.firstName || "").toLowerCase();
    const email = (item.email || "").toLowerCase();
    const phone = (item.phone || "").toLowerCase();
    
    // Filter based on channel requirements
    if (channel === "email" && !item.email) return false;
    if ((channel === "sms" || channel === "whatsapp") && !item.phone) return false;
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           phone.includes(searchLower);
  });

  const isSelected = (id: number, type: "customer" | "lead") => {
    return selectedRecipients.some(r => r.id === id && r.type === type);
  };

  const toggleRecipient = (item: any, type: "customer" | "lead") => {
    const recipient: Recipient = {
      id: item.id,
      name: item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
      email: item.email,
      phone: item.phone,
      type,
    };

    if (isSelected(item.id, type)) {
      onSelectionChange(selectedRecipients.filter(r => !(r.id === item.id && r.type === type)));
    } else {
      onSelectionChange([...selectedRecipients, recipient]);
    }
  };

  const selectAll = () => {
    const newRecipients = filteredList
      .filter((item: any) => {
        if (channel === "email" && !item.email) return false;
        if ((channel === "sms" || channel === "whatsapp") && !item.phone) return false;
        return true;
      })
      .map((item: any) => ({
        id: item.id,
        name: item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
        email: item.email,
        phone: item.phone,
        type: activeTab as "customer" | "lead",
      }))
      .filter((r: Recipient) => !isSelected(r.id, r.type));

    onSelectionChange([...selectedRecipients, ...newRecipients]);
  };

  const deselectAll = () => {
    onSelectionChange(selectedRecipients.filter(r => r.type !== activeTab));
  };

  const removeRecipient = (id: number, type: "customer" | "lead") => {
    onSelectionChange(selectedRecipients.filter(r => !(r.id === id && r.type === type)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Selected Recipients</Label>
          <Badge variant="secondary" className="ml-2">
            {selectedRecipients.length} selected
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deselectAll}
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Selected Recipients List */}
      {selectedRecipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {selectedRecipients.map((recipient) => (
                  <div
                    key={`${recipient.type}-${recipient.id}`}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {recipient.type === "customer" ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : (
                        <User className="h-4 w-4 text-orange-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel === "email" && recipient.email}
                          {(channel === "sms" || channel === "whatsapp") && recipient.phone}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeRecipient(recipient.id, recipient.type)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
          <CardDescription>
            {channel === "email" && "Select customers/leads with email addresses"}
            {channel === "sms" && "Select customers/leads with phone numbers"}
            {channel === "whatsapp" && "Select customers/leads with phone numbers"}
            {channel === "multi_channel" && "Select customers/leads (will use email or phone based on availability)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customers">
                <Users className="h-4 w-4 mr-2" />
                Customers ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="leads">
                <User className="h-4 w-4 mr-2" />
                Leads ({leads.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-4">
              <ScrollArea className="h-64">
                {isLoadingCustomers ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading customers...
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customers found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredList.map((customer: any) => {
                      const selected = isSelected(customer.id, "customer");
                      const hasRequiredContact = 
                        (channel === "email" && customer.email) ||
                        ((channel === "sms" || channel === "whatsapp") && customer.phone) ||
                        channel === "multi_channel";

                      if (!hasRequiredContact) return null;

                      return (
                        <div
                          key={customer.id}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            selected && "bg-blue-50 border-blue-200"
                          )}
                          onClick={() => toggleRecipient(customer, "customer")}
                        >
                          <div
                            className="flex shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleRecipient(customer, "customer")}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {customer.name || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed"}
                            </p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {customer.email && (
                                <span className="truncate">{customer.email}</span>
                              )}
                              {customer.phone && (
                                <span>{customer.phone}</span>
                              )}
                            </div>
                          </div>
                          {selected && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="leads" className="mt-4">
              <ScrollArea className="h-64">
                {isLoadingLeads ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading leads...
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredList.map((lead: any) => {
                      const selected = isSelected(lead.id, "lead");
                      const hasRequiredContact = 
                        (channel === "email" && lead.email) ||
                        ((channel === "sms" || channel === "whatsapp") && lead.phone) ||
                        channel === "multi_channel";

                      if (!hasRequiredContact) return null;

                      return (
                        <div
                          key={lead.id}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            selected && "bg-blue-50 border-blue-200"
                          )}
                          onClick={() => toggleRecipient(lead, "lead")}
                        >
                          <div
                            className="flex shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleRecipient(lead, "lead")}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lead.name || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unnamed"}
                            </p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {lead.email && (
                                <span className="truncate">{lead.email}</span>
                              )}
                              {lead.phone && (
                                <span>{lead.phone}</span>
                              )}
                            </div>
                          </div>
                          {selected && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

