import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Target, DollarSign, Users, Calendar, MapPin, Clock, Sparkles, ThumbsUp, Gift, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";

export default function BookingRecommendations() {
  const { tenant } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { data: customers = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/booking-recommendations`, selectedCustomerId],
    enabled: !!tenant?.id && !!selectedCustomerId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/booking-recommendations/${selectedCustomerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
  });

  const { data: revenueOptimization, isLoading: revenueLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/revenue-optimization`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/revenue-optimization`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch revenue optimization");
      return response.json();
    },
  });

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'customer_history': return <Users className="h-4 w-4" />;
      case 'preferences': return <Target className="h-4 w-4" />;
      case 'lead_behavior': return <TrendingUp className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'customer_history': return 'Based on History';
      case 'preferences': return 'Personal Preferences';
      case 'lead_behavior': return 'Engagement Behavior';
      case 'seasonal': return 'Seasonal Match';
      default: return 'Popular Choice';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <ThumbsUp className="h-4 w-4 text-green-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Booking Recommendations</h1>
            <p className="text-gray-600">AI-powered recommendations to boost conversions and revenue</p>
          </div>
        </div>

        <Tabs defaultValue="customer-recommendations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer-recommendations">Customer Recommendations</TabsTrigger>
            <TabsTrigger value="revenue-optimization">Revenue Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="customer-recommendations" className="space-y-4">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Select Customer for Personalized Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a customer to see personalized recommendations" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.firstName} {customer.lastName} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {selectedCustomerId && (
              <div className="space-y-4">
                {recommendationsLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </CardContent>
                  </Card>
                ) : recommendations.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
                      <p className="text-gray-500 text-center">
                        This customer might need more data or all packages might not match their preferences.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {recommendations.map((rec: any, index: number) => (
                        <Card key={rec.packageId} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(rec.score)}`}>
                                    <Star className="h-3 w-3 mr-1" />
                                    {rec.score}% Match
                                  </div>
                                </div>
                                <div>
                                  <CardTitle className="text-xl">{rec.packageName}</CardTitle>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{rec.destination}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{rec.duration} days</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="h-3 w-3" />
                                      <span>${rec.price}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="flex items-center space-x-1">
                                {getMatchTypeIcon(rec.matchType)}
                                <span>{getMatchTypeLabel(rec.matchType)}</span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-2">Why this recommendation:</h4>
                                <ul className="space-y-1">
                                  {rec.reasons.map((reason: string, idx: number) => (
                                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                                      <ThumbsUp className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                      <span>{reason}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" className="flex-1">
                                  Create Booking
                                </Button>
                                <Button size="sm" variant="outline">
                                  View Package Details
                                </Button>
                                <Button size="sm" variant="outline">
                                  Send Recommendation
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue-optimization" className="space-y-4">
            {revenueLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Revenue Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Current Month Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(revenueOptimization?.currentMonthRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Revenue generated this month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue Target</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(revenueOptimization?.projectedRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Projected monthly target
                      </p>
                      <Progress 
                        value={(revenueOptimization?.currentMonthRevenue || 0) / (revenueOptimization?.projectedRevenue || 1) * 100} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Optimization Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Revenue Optimization Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueOptimization?.recommendations?.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">All optimized!</h3>
                        <p className="text-gray-500">Your revenue streams are already well optimized.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {revenueOptimization?.recommendations?.map((rec: any, index: number) => (
                          <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                            <div className="flex-shrink-0">
                              {getPriorityIcon(rec.priority)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                  {rec.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="text-sm font-medium text-green-600">
                                  +{formatCurrency(rec.impact)} potential
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Implement Strategy
                                </Button>
                                <Button size="sm" variant="ghost">
                                  Learn More
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}