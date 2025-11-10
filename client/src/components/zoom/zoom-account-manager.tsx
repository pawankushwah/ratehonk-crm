import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Star, Trash2, Plus, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ZoomAccount {
  id: number;
  label: string;
  email?: string;
  isPrimary: boolean;
  expiresAt: string;
  createdAt: string;
}

interface ZoomAccountManagerProps {
  className?: string;
}

export function ZoomAccountManager({ className }: ZoomAccountManagerProps) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAccountLabel, setNewAccountLabel] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");

  // Fetch all Zoom accounts
  const { data: accountsData, isLoading } = useQuery<{ accounts: ZoomAccount[] }>({
    queryKey: ["/api/zoom/accounts"],
    enabled: !!tenant?.id,
  });

  const accounts: ZoomAccount[] = accountsData?.accounts || [];

  // Set primary account mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest("POST", `/api/zoom/accounts/${accountId}/set-primary`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zoom/accounts"] });
      toast({
        title: "Primary Account Updated",
        description: "The selected account is now your primary Zoom Phone account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary account",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest("DELETE", `/api/zoom/accounts/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zoom/accounts"] });
      toast({
        title: "Account Disconnected",
        description: "Zoom account has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect account",
        variant: "destructive",
      });
    },
  });

  // Connect new account
  const handleConnectAccount = () => {
    if (!newAccountLabel.trim()) {
      toast({
        title: "Label Required",
        description: "Please enter a label for this account.",
        variant: "destructive",
      });
      return;
    }

    // Build OAuth URL with label and email
    const params = new URLSearchParams({
      label: newAccountLabel,
      ...(newAccountEmail && { email: newAccountEmail }),
    });

    const clientId = import.meta.env.VITE_ZOOM_CLIENT_ID || 'jFjKs6lXTDGXmL_Yjwh7Vw';
    const redirectUri = encodeURIComponent(window.location.origin + '/api/zoom/oauth/callback');
    const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${params.toString()}`;

    window.location.href = oauthUrl;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-cyan-600" />
            Zoom Phone Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-cyan-600" />
              Zoom Phone Accounts
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-add-zoom-account"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Manage multiple Zoom Phone accounts for different teams or departments
          </p>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Zoom Accounts Connected</h3>
              <p className="text-gray-600 mb-4">
                Connect your first Zoom Phone account to start making calls
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
                data-testid="button-connect-first-account"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  data-testid={`account-item-${account.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      account.isPrimary ? 'bg-cyan-100' : 'bg-gray-100'
                    }`}>
                      <Phone className={`h-5 w-5 ${
                        account.isPrimary ? 'text-cyan-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900" data-testid={`text-account-label-${account.id}`}>
                          {account.label}
                        </h4>
                        {account.isPrimary && (
                          <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100" data-testid={`badge-primary-${account.id}`}>
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      {account.email && (
                        <p className="text-sm text-gray-600" data-testid={`text-account-email-${account.id}`}>
                          {account.email}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Connected on {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryMutation.mutate(account.id)}
                        disabled={setPrimaryMutation.isPending}
                        data-testid={`button-set-primary-${account.id}`}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to disconnect "${account.label}"?`)) {
                          deleteAccountMutation.mutate(account.id);
                        }
                      }}
                      disabled={deleteAccountMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${account.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {accounts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Multiple Account Benefits</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Separate phone numbers for different departments</li>
                    <li>• Independent call logs and recordings per account</li>
                    <li>• Team-specific Zoom Phone configurations</li>
                    <li>• Primary account used by default for all calls</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect New Zoom Phone Account</DialogTitle>
            <DialogDescription>
              Add a label to identify this account (e.g., "Sales Team", "Support Line")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="accountLabel">Account Label *</Label>
              <Input
                id="accountLabel"
                placeholder="e.g., Sales Team, Support Line"
                value={newAccountLabel}
                onChange={(e) => setNewAccountLabel(e.target.value)}
                data-testid="input-account-label"
              />
              <p className="text-xs text-gray-600 mt-1">
                This helps you identify which account to use
              </p>
            </div>
            <div>
              <Label htmlFor="accountEmail">Email (Optional)</Label>
              <Input
                id="accountEmail"
                type="email"
                placeholder="zoom.account@company.com"
                value={newAccountEmail}
                onChange={(e) => setNewAccountEmail(e.target.value)}
                data-testid="input-account-email"
              />
              <p className="text-xs text-gray-600 mt-1">
                The email associated with this Zoom account
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewAccountLabel("");
                setNewAccountEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnectAccount}
              disabled={!newAccountLabel.trim()}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-confirm-connect"
            >
              Connect to Zoom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
