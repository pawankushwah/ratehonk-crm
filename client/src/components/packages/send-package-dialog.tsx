import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { Mail, MessageCircle, Loader2, X } from "lucide-react";
import type { TravelPackage } from "@/lib/types";
import { useAuth } from "@/components/auth/auth-provider";

interface SendPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: TravelPackage;
}

type RecipientType = "customer" | "lead";
type SendMethod = "email" | "whatsapp";

interface SelectedRecipient {
  id: number;
  type: RecipientType;
  name: string;
  email?: string;
  phone?: string;
}

export function SendPackageDialog({
  open,
  onOpenChange,
  package: pkg,
}: SendPackageDialogProps) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [recipientType, setRecipientType] = useState<RecipientType>("customer");
  const [sendMethod, setSendMethod] = useState<SendMethod>("email");
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  
  // Fetch customers
  const { data: customersData = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id && open && recipientType === "customer",
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });
  
  // Fetch leads
  const { data: leadsData = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    enabled: !!tenant?.id && open && recipientType === "lead",
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });
  
  const recipients = recipientType === "customer" ? customersData : leadsData;
  
  // Toggle recipient selection
  const toggleRecipient = (recipient: any) => {
    const recipientData: SelectedRecipient = {
      id: recipient.id,
      type: recipientType,
      name: recipient.name || `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim() || `Recipient ${recipient.id}`,
      email: recipient.email,
      phone: recipient.phone || recipient.mobile,
    };
    
    const isSelected = selectedRecipients.some(
      (r) => r.id === recipientData.id && r.type === recipientData.type
    );
    
    if (isSelected) {
      setSelectedRecipients(
        selectedRecipients.filter(
          (r) => !(r.id === recipientData.id && r.type === recipientData.type)
        )
      );
    } else {
      setSelectedRecipients([...selectedRecipients, recipientData]);
    }
  };
  
  // Send package mutation
  const sendPackageMutation = useMutation({
    mutationFn: async () => {
      if (selectedRecipients.length === 0) {
        throw new Error("Please select at least one recipient");
      }
      
      // Validate based on send method
      if (sendMethod === "email") {
        const invalidRecipients = selectedRecipients.filter((r) => !r.email);
        if (invalidRecipients.length > 0) {
          throw new Error(
            `Selected recipients missing email: ${invalidRecipients.map((r) => r.name).join(", ")}`
          );
        }
      } else if (sendMethod === "whatsapp") {
        const invalidRecipients = selectedRecipients.filter((r) => !r.phone);
        if (invalidRecipients.length > 0) {
          throw new Error(
            `Selected recipients missing phone number: ${invalidRecipients.map((r) => r.name).join(", ")}`
          );
        }
      }
      
      return await apiRequest("POST", `/api/tenants/${tenant?.id}/packages/${pkg.id}/send`, {
        recipients: selectedRecipients.map((r) => ({
          id: r.id,
          type: r.type,
        })),
        sendMethod,
        customMessage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Package Sent",
        description: `Package sent to ${selectedRecipients.length} recipient(s) via ${sendMethod === "email" ? "Email" : "WhatsApp"}`,
      });
      setSelectedRecipients([]);
      setCustomMessage("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send package",
        variant: "destructive",
      });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Package: {pkg.name}</DialogTitle>
          <DialogDescription>
            Select recipients and send this package via email or WhatsApp with PDF attachment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Recipient Type Selection */}
          <div className="space-y-2">
            <Label>Select Recipients From</Label>
            <Select
              value={recipientType}
              onValueChange={(value: RecipientType) => {
                setRecipientType(value);
                setSelectedRecipients([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Send Method Selection */}
          <div className="space-y-2">
            <Label>Send Via</Label>
            <Select
              value={sendMethod}
              onValueChange={(value: SendMethod) => setSendMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Recipients List */}
          <div className="space-y-2">
            <Label>
              Select Recipients ({selectedRecipients.length} selected)
            </Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {recipients.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No {recipientType === "customer" ? "customers" : "leads"} found
                </p>
              ) : (
                <div className="space-y-2">
                  {recipients.map((recipient: any) => {
                    const recipientId = recipient.id;
                    const recipientName = recipient.name || `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim() || `Recipient ${recipientId}`;
                    const recipientEmail = recipient.email;
                    const recipientPhone = recipient.phone || recipient.mobile;
                    const isSelected = selectedRecipients.some(
                      (r) => r.id === recipientId && r.type === recipientType
                    );
                    const isValid = sendMethod === "email" ? !!recipientEmail : !!recipientPhone;
                    
                    return (
                      <div
                        key={recipientId}
                        className={`flex items-center space-x-3 p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                          !isValid ? "opacity-50" : ""
                        }`}
                        onClick={() => isValid && toggleRecipient(recipient)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={!isValid}
                          onCheckedChange={() => isValid && toggleRecipient(recipient)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{recipientName}</div>
                          <div className="text-sm text-gray-500">
                            {sendMethod === "email" ? (
                              recipientEmail || "No email"
                            ) : (
                              recipientPhone || "No phone"
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Textarea
              placeholder={`Add a personal message to include with the package...`}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Selected Recipients Summary */}
          {selectedRecipients.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Recipients</Label>
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map((recipient) => (
                  <div
                    key={`${recipient.type}-${recipient.id}`}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>{recipient.name}</span>
                    <button
                      onClick={() =>
                        setSelectedRecipients(
                          selectedRecipients.filter(
                            (r) => !(r.id === recipient.id && r.type === recipient.type)
                          )
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedRecipients([]);
              setCustomMessage("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => sendPackageMutation.mutate()}
            disabled={selectedRecipients.length === 0 || sendPackageMutation.isPending}
          >
            {sendPackageMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                {sendMethod === "email" ? (
                  <Mail className="mr-2 h-4 w-4" />
                ) : (
                  <MessageCircle className="mr-2 h-4 w-4" />
                )}
                Send Package
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
