import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Mail } from "lucide-react";

interface EmailEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: {
    id: number;
    estimateNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: string;
    title: string;
  };
}

export function EmailEstimateDialog({ open, onOpenChange, estimate }: EmailEstimateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailData, setEmailData] = useState({
    to: estimate.customerEmail,
    subject: `Estimate ${estimate.estimateNumber} - ${estimate.title}`,
    message: `Dear ${estimate.customerName},

Please find attached your estimate for ${estimate.title}.

Estimate Details:
- Estimate Number: ${estimate.estimateNumber}
- Total Amount: $${estimate.totalAmount}

Please review the estimate and let us know if you have any questions. You can accept this estimate by replying to this email.

Thank you for your business!

Best regards,
Your Team`
  });

  const emailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/estimates/${estimate.id}/email`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      onOpenChange(false);
      toast({
        title: "Email Sent",
        description: `Estimate has been emailed to ${emailData.to}. Status updated to "Sent".`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send estimate email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!emailData.to || !emailData.subject) {
      toast({
        title: "Validation Error",
        description: "Email address and subject are required",
        variant: "destructive",
      });
      return;
    }

    emailMutation.mutate(emailData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Estimate {estimate.estimateNumber}
          </DialogTitle>
          <DialogDescription>
            Send this estimate to your customer via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Estimate subject line"
            />
          </div>

          <div>
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              rows={10}
              placeholder="Email message content"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• A PDF copy of the estimate will be attached to the email</li>
              <li>• Customer can review and respond with acceptance</li>
              <li>• Estimate status will be updated to "Sent"</li>
              <li>• You'll receive a copy of the sent email for your records</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={emailMutation.isPending}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {emailMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}