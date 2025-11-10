import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Play, Trophy, Target, BarChart3, Users, Clock, Mail } from "lucide-react";
import type { EmailABTest, InsertEmailABTest } from "@shared/schema";

export default function EmailABTests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: abTests = [], isLoading } = useQuery({
    queryKey: ["/api/tenants/1/email-ab-tests"],
  });

  const createABTestMutation = useMutation({
    mutationFn: (data: InsertEmailABTest) =>
      apiRequest(`/api/tenants/1/email-ab-tests`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/1/email-ab-tests"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "A/B Test Created!",
        description: "Your email A/B test is ready to optimize performance.",
      });
    },
  });

  const startTestMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/tenants/1/email-ab-tests/${id}/start`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/1/email-ab-tests"] });
      toast({
        title: "A/B Test Started!",
        description: "Your test is now running and collecting data.",
      });
    },
  });

  const handleCreateABTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const testData: InsertEmailABTest = {
      tenantId: 1,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      testType: formData.get("testType") as string,
      variantA: {
        name: "Variant A",
        value: formData.get("variantA") as string,
      },
      variantB: {
        name: "Variant B", 
        value: formData.get("variantB") as string,
      },
      testDuration: parseInt(formData.get("testDuration") as string) || 24,
      sampleSize: parseInt(formData.get("sampleSize") as string) || 100,
      status: "draft",
    };

    createABTestMutation.mutate(testData);
  };

  const filteredTests = Array.isArray(abTests) 
    ? abTests.filter((test: EmailABTest) =>
        test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subject_line: "Subject Line",
      content: "Email Content",
      send_time: "Send Time",
      sender_name: "Sender Name"
    };
    return labels[type] || type;
  };

  const getTestTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      subject_line: Mail,
      content: BarChart3,
      send_time: Clock,
      sender_name: Users
    };
    const Icon = icons[type] || Target;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    };
    return colors[status] || colors.draft;
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            A/B Testing
          </h1>
          <p className="text-muted-foreground">
            Optimize your email campaigns with data-driven A/B testing
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="mr-2 h-4 w-4" />
              Create A/B Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Test different versions of your email to optimize performance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateABTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Subject Line Test"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select name="testType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject_line">Subject Line</SelectItem>
                      <SelectItem value="content">Email Content</SelectItem>
                      <SelectItem value="send_time">Send Time</SelectItem>
                      <SelectItem value="sender_name">Sender Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Testing different subject lines to improve open rates..."
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variantA">Variant A</Label>
                  <Input
                    id="variantA"
                    name="variantA"
                    placeholder="Your Amazing Deal Awaits!"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantB">Variant B</Label>
                  <Input
                    id="variantB"
                    name="variantB"
                    placeholder="Don't Miss This Special Offer"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testDuration">Duration (Hours)</Label>
                  <Input
                    id="testDuration"
                    name="testDuration"
                    type="number"
                    placeholder="24"
                    min="1"
                    max="168"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size</Label>
                  <Input
                    id="sampleSize"
                    name="sampleSize"
                    type="number"
                    placeholder="100"
                    min="10"
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
                  disabled={createABTestMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {createABTestMutation.isPending ? "Creating..." : "Create Test"}
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
          placeholder="Search A/B tests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredTests.filter((t: EmailABTest) => t.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active experiments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredTests.filter((t: EmailABTest) => t.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Finished experiments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">+23.5%</div>
            <p className="text-xs text-muted-foreground">
              Open rate increase
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredTests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All experiments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* A/B Tests List */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start optimizing your email campaigns with data-driven A/B testing.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First A/B Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTests.map((test: EmailABTest) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      {getTestTypeIcon(test.testType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{test.name}</h3>
                      <p className="text-muted-foreground">{test.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getTestTypeLabel(test.testType)}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {test.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => startTestMutation.mutate(test.id)}
                      disabled={startTestMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Test
                    </Button>
                  )}
                </div>
                
                {/* Test Variants */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Variant A</span>
                      <Badge variant="secondary" className="text-xs">Control</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typeof test.variantA === 'object' ? test.variantA.value : test.variantA}
                    </p>
                    {test.status === "running" || test.status === "completed" ? (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Open Rate</span>
                          <span>24.5%</span>
                        </div>
                        <Progress value={24.5} className="h-2" />
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Variant B</span>
                      {test.winningVariant === "b" && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typeof test.variantB === 'object' ? test.variantB.value : test.variantB}
                    </p>
                    {test.status === "running" || test.status === "completed" ? (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Open Rate</span>
                          <span>31.2%</span>
                        </div>
                        <Progress value={31.2} className="h-2" />
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Test Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span>Duration: {test.testDuration}h</span>
                    <span>Sample: {test.sampleSize} recipients</span>
                  </div>
                  {test.status === "running" && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>12h remaining</span>
                    </div>
                  )}
                  {test.status === "completed" && test.winningVariant && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Trophy className="h-4 w-4" />
                      <span>Variant {test.winningVariant.toUpperCase()} won by +27%</span>
                    </div>
                  )}
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