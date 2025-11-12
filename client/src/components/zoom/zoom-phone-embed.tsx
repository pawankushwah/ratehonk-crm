import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, X, Maximize2, Minimize2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";

interface ZoomPhoneEmbedProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
  customerName?: string;
}

interface ZoomAccount {
  id: number;
  label: string;
  email?: string;
  isPrimary: boolean;
}

export function ZoomPhoneEmbed({
  isOpen,
  onClose,
  customerPhone,
  customerName,
}: ZoomPhoneEmbedProps) {
  const { tenant } = useAuth();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Fetch all Zoom accounts
  const { data: accountsData } = useQuery<{ accounts: ZoomAccount[] }>({
    queryKey: ["/api/zoom/accounts"],
    enabled: !!tenant?.id && isOpen,
  });

  const accounts = accountsData?.accounts || [];
  const primaryAccount = accounts.find(acc => acc.isPrimary);
  
  // Use primary account by default
  const activeAccountId = selectedAccountId || primaryAccount?.id || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isMaximized ? "max-w-[95vw] h-[95vh]" : "max-w-[800px] h-[700px]"
        } p-0 overflow-hidden transition-all`}
      >
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Phone className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Zoom Phone
                  </DialogTitle>
                  {customerName && (
                    <DialogDescription className="text-sm text-gray-600">
                      Calling {customerName}
                      {customerPhone && ` (${customerPhone})`}
                    </DialogDescription>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-8 w-8 p-0"
                >
                  {isMaximized ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {accounts.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Call From:
                </label>
                <Select
                  value={activeAccountId?.toString()}
                  onValueChange={(value) => setSelectedAccountId(parseInt(value))}
                >
                  <SelectTrigger className="h-9 bg-white" data-testid="select-zoom-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem 
                        key={account.id} 
                        value={account.id.toString()}
                        data-testid={`option-account-${account.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{account.label}</span>
                          {account.isPrimary && (
                            <Star className="h-3 w-3 text-cyan-600 fill-cyan-600" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 bg-white relative h-full">
          <iframe
            src="https://applications.zoom.us/integration/phone/embeddablephone/home"
            className="w-full h-full border-0"
            allow="microphone; camera; autoplay"
            title="Zoom Phone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-storage-access-by-user-activation"
            data-testid="zoom-phone-iframe"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-600">
          <p>
            📌 <strong>First time?</strong> Sign in with your Zoom account in
            the window above to enable calling features.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
