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
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Users, Target, Filter, TrendingUp, MapPin, Calendar } from "lucide-react";
import type { EmailSegment, InsertEmailSegment } from "@shared/schema";

export default function EmailSegments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["/api/tenants/1/email-segments"],
  });

  const createSegmentMutation = useMutation({
    mutationFn: (data: InsertEmailSegment) =>
      apiRequest(`/api/tenants/1/email-segments`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/1/email-segments"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Segment Created!",
        description: "Your email segment is ready for targeted campaigns.",
      });
    },
  });

  const handleCreateSegment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const segmentData: InsertEmailSegment = {
      tenantId: 1,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      filterConditions: {
        customerStatus: formData.get("customerStatus") as string,
        bookingCount: formData.get("bookingCount") as string,
        lastActivity: formData.get("lastActivity") as string,
        location: formData.get("location") as string,
      },
      subscriberCount: 0,
      isActive: true,
    };

    createSegmentMutation.mutate(segmentData);
  };

  const filteredSegments = Array.isArray(segments) 
    ? segments.filter((segment: EmailSegment) =>
        segment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        segment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getSegmentIcon = (conditions: any) => {
    if (!conditions) return Filter;
    if (conditions.location) return MapPin;
    if (conditions.lastActivity) return Calendar;
    if (conditions.bookingCount) return TrendingUp;
    return Users;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Email Segments
          </h1>
          <p className="text-muted-foreground">
            Create targeted customer segments for personalized email campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Email Segment</DialogTitle>
              <DialogDescription>
                Define criteria to target specific groups of customers with relevant content.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSegment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="High-Value Customers"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerStatus">Customer Status</Label>
                  <Select name="customerStatus">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Customers who have made multiple bookings and high spending..."
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingCount">Booking Count</Label>
                  <Select name="bookingCount">
                    <SelectTrigger>
                      <SelectValue placeholder="Number of bookings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No bookings</SelectItem>
                      <SelectItem value="1">1 booking</SelectItem>
                      <SelectItem value="2-5">2-5 bookings</SelectItem>
                      <SelectItem value="5+">5+ bookings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastActivity">Last Activity</Label>
                  <Select name="lastActivity">
                    <SelectTrigger>
                      <SelectValue placeholder="Recent activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., New York, California, Europe"
                />
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
                  disabled={createSegmentMutation.isPending}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  {createSegmentMutation.isPending ? "Creating..." : "Create Segment"}
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
          placeholder="Search segments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <Target className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {filteredSegments.filter((s: EmailSegment) => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">2,847</div>
            <p className="text-xs text-muted-foreground">
              Across all segments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Segment Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">487</div>
            <p className="text-xs text-muted-foreground">
              Subscribers per segment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Targeting Score</CardTitle>
            <Filter className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">92%</div>
            <p className="text-xs text-muted-foreground">
              Segmentation accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segments List */}
      <div className="space-y-4">
        {filteredSegments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Segments Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create customer segments to send targeted emails that convert better.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Segment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSegments.map((segment: EmailSegment) => {
              const Icon = getSegmentIcon(segment.filterConditions);
              return (
                <Card key={segment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                          <Icon className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{segment.name}</h3>
                          <p className="text-muted-foreground text-sm">
                            {segment.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={segment.isActive ? "default" : "secondary"}
                        className={
                          segment.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {segment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Segment Criteria */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Targeting Criteria:</h4>
                      <div className="flex flex-wrap gap-2">
                        {segment.filterConditions && typeof segment.filterConditions === 'object' && (
                          <>
                            {Object.entries(segment.filterConditions as Record<string, any>).map(([key, value]) => {
                              if (!value) return null;
                              return (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                                </Badge>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Segment Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{segment.subscriberCount || 0} subscribers</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                          Use in Campaign
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}