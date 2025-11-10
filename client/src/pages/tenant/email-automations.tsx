import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Play, Pause, Settings, Clock, Users, Mail, Zap } from "lucide-react";
import type { EmailAutomation, InsertEmailAutomation } from "@shared/schema";
import { Layout } from "@/components/layout/layout";

export default function EmailAutomations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["/api/tenants/1/email-automations"],
  });

  const createAutomationMutation = useMutation({
    mutationFn: (data: InsertEmailAutomation) =>
      apiRequest(`/api/tenants/1/email-automations`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/1/email-automations"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Automation Created!",
        description: "Your email automation workflow is ready to engage customers.",
      });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/tenants/1/email-automations/${id}/toggle`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/1/email-automations"] });
      toast({
        title: "Automation Updated",
        description: "The automation status has been changed.",
      });
    },
  });

  const handleCreateAutomation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const automationData: InsertEmailAutomation = {
      tenantId: 1,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      triggerType: formData.get("triggerType") as string,
      triggerConditions: {
        delay: parseInt(formData.get("delayHours") as string) || 0,
        condition: formData.get("condition") as string,
      },
      delayHours: parseInt(formData.get("delayHours") as string) || 0,
      isActive: true,
    };

    createAutomationMutation.mutate(automationData);
  };

  const filteredAutomations = Array.isArray(automations) 
    ? automations.filter((automation: EmailAutomation) =>
        automation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        automation.triggerType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer_signup: "Customer Signup",
      booking_confirmed: "Booking Confirmed",
      lead_created: "New Lead",
      date_based: "Date-Based",
      behavior_based: "Behavior-Based"
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, any> = {
      customer_signup: Users,
      booking_confirmed: Mail,
      lead_created: Zap,
      date_based: Clock,
      behavior_based: Settings
    };
    const Icon = icons[type] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Email Automations
          </h1>
          <p className="text-muted-foreground">
            Create powerful automated email workflows to engage customers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Email Automation</DialogTitle>
              <DialogDescription>
                Set up an automated email workflow to engage customers at the right time.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAutomation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Automation Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Welcome Series"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select name="triggerType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_signup">Customer Signup</SelectItem>
                      <SelectItem value="booking_confirmed">Booking Confirmed</SelectItem>
                      <SelectItem value="lead_created">New Lead</SelectItem>
                      <SelectItem value="date_based">Date-Based</SelectItem>
                      <SelectItem value="behavior_based">Behavior-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Automated welcome series for new customers..."
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delayHours">Delay (Hours)</Label>
                  <Input
                    id="delayHours"
                    name="delayHours"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    name="condition"
                    placeholder="After signup"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAutomationMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {createAutomationMutation.isPending ? "Creating..." : "Create Automation"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search automations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredAutomations.filter((a: EmailAutomation) => a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Running workflows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredAutomations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Created workflows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1,247</div>
            <p className="text-xs text-muted-foreground">
              Via automations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">68.5%</div>
            <p className="text-xs text-muted-foreground">
              Average open rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {filteredAutomations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Automations Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first automated email workflow to engage customers automatically.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Automation
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAutomations.map((automation: EmailAutomation) => (
            <Card key={automation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      {getTriggerIcon(automation.triggerType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{automation.name}</h3>
                      <p className="text-muted-foreground">{automation.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getTriggerTypeLabel(automation.triggerType)}
                        </Badge>
                        {automation.delayHours > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {automation.delayHours}h delay
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={automation.isActive ? "default" : "secondary"}
                      className={
                        automation.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }
                    >
                      {automation.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAutomationMutation.mutate(automation.id)}
                      disabled={toggleAutomationMutation.isPending}
                    >
                      {automation.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </Layout>
  );
}