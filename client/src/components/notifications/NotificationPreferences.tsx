import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  // Module-specific preferences
  leadNotifications: boolean;
  customerNotifications: boolean;
  invoiceNotifications: boolean;
  estimateNotifications: boolean;
  bookingNotifications: boolean;
  taskNotifications: boolean;
  followupNotifications: boolean;
  paymentNotifications: boolean;
  expenseNotifications: boolean;
  systemNotifications: boolean;
  // Priority filters
  urgentOnly: boolean;
  highPriorityOnly: boolean;
}

interface NotificationPreferencesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesPanel({
  open,
  onOpenChange,
}: NotificationPreferencesPanelProps) {
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    leadNotifications: true,
    customerNotifications: true,
    invoiceNotifications: true,
    estimateNotifications: true,
    bookingNotifications: true,
    taskNotifications: true,
    followupNotifications: true,
    paymentNotifications: true,
    expenseNotifications: true,
    systemNotifications: true,
    urgentOnly: false,
    highPriorityOnly: false,
  });

  // Fetch user preferences
  const { data: savedPreferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: [`/api/user/notification-preferences`, user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/user/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        // Return defaults if not found
        return preferences;
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, [savedPreferences]);

  // Save preferences
  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      return apiRequest("PUT", `/api/user/notification-preferences`, prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/notification-preferences`, user?.id] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </SheetTitle>
          <SheetDescription>
            Customize how and when you receive notifications
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* General Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="inApp">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the app
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="inApp"
                    checked={preferences.inAppNotifications}
                    onCheckedChange={() => handleToggle("inAppNotifications")}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email"
                    checked={preferences.emailNotifications}
                    onCheckedChange={() => handleToggle("emailNotifications")}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="push">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push"
                    checked={preferences.pushNotifications}
                    onCheckedChange={() => handleToggle("pushNotifications")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Module-Specific Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Module Notifications</CardTitle>
                <CardDescription>
                  Choose which modules send you notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: "leadNotifications", label: "Leads", description: "Lead assignments, updates, and conversions" },
                    { key: "customerNotifications", label: "Customers", description: "Customer updates and assignments" },
                    { key: "invoiceNotifications", label: "Invoices", description: "Invoice creation, payments, and overdue alerts" },
                    { key: "estimateNotifications", label: "Estimates", description: "Estimate creation and status changes" },
                    { key: "bookingNotifications", label: "Bookings", description: "Booking confirmations and cancellations" },
                    { key: "taskNotifications", label: "Tasks", description: "Task assignments and due dates" },
                    { key: "followupNotifications", label: "Follow-ups", description: "Follow-up reminders and completions" },
                    { key: "paymentNotifications", label: "Payments", description: "Payment received and failed notifications" },
                    { key: "expenseNotifications", label: "Expenses", description: "Expense creation and approvals" },
                    { key: "systemNotifications", label: "System", description: "System updates and announcements" },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={preferences[key as keyof NotificationPreferences] as boolean}
                        onCheckedChange={() => handleToggle(key as keyof NotificationPreferences)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Filters</CardTitle>
                <CardDescription>
                  Filter notifications by priority level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="urgentOnly">Urgent Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only show urgent priority notifications
                    </p>
                  </div>
                  <Switch
                    id="urgentOnly"
                    checked={preferences.urgentOnly}
                    onCheckedChange={() => handleToggle("urgentOnly")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="highPriorityOnly">High Priority & Above</Label>
                    <p className="text-sm text-muted-foreground">
                      Show high and urgent priority notifications
                    </p>
                  </div>
                  <Switch
                    id="highPriorityOnly"
                    checked={preferences.highPriorityOnly}
                    onCheckedChange={() => handleToggle("highPriorityOnly")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

