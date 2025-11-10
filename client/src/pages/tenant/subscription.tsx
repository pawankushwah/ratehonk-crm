import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { 
  CreditCard, Check, Star, Calendar, Download, AlertCircle, 
  Loader2, DollarSign, Clock, Shield, Zap
} from "lucide-react";
import { SubscriptionAPIClient } from "@/lib/subscription-api";

// Initialize Stripe (you'll need to set VITE_STRIPE_PUBLIC_KEY)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_example');

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  maxUsers: number;
  maxCustomers: number;
  features: string[];
  isActive: boolean;
}

interface PaymentMethod {
  id: number;
  type: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface PaymentHistory {
  id: number;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  receiptUrl?: string;
  createdAt: string;
}

const StripePaymentForm = ({ planId, billingCycle, onSuccess }: { 
  planId: number; 
  billingCycle: string; 
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Create subscription using API client
      try {
        const result = await SubscriptionAPIClient.createSubscription({
          planId,
          billingCycle,
          paymentGateway: 'stripe',
          paymentMethodId: paymentMethod?.id,
        });

        if (result.status === 'trial') {
          toast({
            title: "Subscription Created",
            description: "Your 14-day trial period has started!",
          });
        } else {
          toast({
            title: "Subscription Created", 
            description: "Your subscription has been activated successfully!",
          });
        }
        onSuccess();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create subscription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe with Stripe"
        )}
      </Button>
    </form>
  );
};

const RazorpayPaymentForm = ({ planId, billingCycle, amount, onSuccess }: { 
  planId: number; 
  billingCycle: string; 
  amount: number;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);

    try {
      // Create subscription
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          paymentGateway: 'razorpay',
        }),
      });

      const result = await response.json();

      if (window.Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          name: 'Travel CRM',
          description: `${billingCycle} subscription`,
          subscription_id: result.subscriptionId,
          handler: (response: any) => {
            toast({
              title: "Payment Successful",
              description: "Your subscription has been activated!",
            });
            onSuccess();
          },
          prefill: {
            email: localStorage.getItem('userEmail') || '',
            contact: localStorage.getItem('userPhone') || '',
          },
          theme: {
            color: '#3B82F6',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast({
          title: "Error",
          description: "Razorpay not loaded. Please refresh and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleRazorpayPayment}
      disabled={isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        "Subscribe with Razorpay"
      )}
    </Button>
  );
};

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<string>('current');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Mock subscription plans data to ensure functionality
  const mockPlans: SubscriptionPlan[] = [
    {
      id: 1,
      name: "Starter",
      description: "Perfect for small travel agencies",
      monthlyPrice: "29",
      yearlyPrice: "290",
      maxUsers: 3,
      maxCustomers: 500,
      features: [
        "Basic CRM features",
        "Lead management", 
        "Customer database",
        "Email support"
      ],
      isActive: true
    },
    {
      id: 2,
      name: "Professional",
      description: "Ideal for growing businesses",
      monthlyPrice: "79",
      yearlyPrice: "790", 
      maxUsers: 10,
      maxCustomers: 2000,
      features: [
        "Advanced CRM features",
        "Lead scoring",
        "Email automation",
        "Social media integration",
        "Priority support"
      ],
      isActive: true
    },
    {
      id: 3,
      name: "Enterprise",
      description: "For large travel companies",
      monthlyPrice: "199",
      yearlyPrice: "1990",
      maxUsers: 50,
      maxCustomers: 10000,
      features: [
        "Full CRM suite",
        "Advanced analytics",
        "Custom integrations",
        "API access",
        "24/7 support",
        "White-label options"
      ],
      isActive: true
    }
  ];

  // Fetch subscription plans with fallback to mock data
  const { data: apiPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
    queryFn: () => SubscriptionAPIClient.getPlans(),
  });

  // Use API data if available, otherwise use mock plans
  const plans = apiPlans.length > 0 ? apiPlans : mockPlans;

  // Fetch current subscription from API
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
    queryFn: () => SubscriptionAPIClient.getCurrentSubscription(),
  });





  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: methodsLoading } = useQuery({
    queryKey: ['/api/subscription/payment-methods'],
    queryFn: () => SubscriptionAPIClient.getPaymentMethods(),
  });

  // Fetch payment history
  const { data: paymentHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/subscription/payment-history'],
    queryFn: () => SubscriptionAPIClient.getPaymentHistory(),
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => SubscriptionAPIClient.cancelSubscription(),
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/plans'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: { planId: number; billingCycle: string; paymentGateway: string }) => 
      SubscriptionAPIClient.createSubscription(data),
    onSuccess: () => {
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/payment-history'] });
      toast({
        title: "Subscription Created",
        description: "Welcome to Travel CRM! Your subscription is now active.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscriptionSuccess = () => {
    if (selectedPlan) {
      createSubscriptionMutation.mutate({
        planId: selectedPlan,
        billingCycle,
        paymentGateway,
      });
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Subscription & Billing</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full">
            <TabsList className="grid w-full grid-cols-2 grid-rows-2 gap-1 h-auto sm:grid-cols-4 sm:grid-rows-1 sm:h-10">
              <TabsTrigger value="current" data-tab="current" className="text-xs sm:text-sm h-8 sm:h-auto">
                <span className="hidden sm:inline">Current Plan</span>
                <span className="sm:hidden">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="plans" data-tab="plans" className="text-xs sm:text-sm h-8 sm:h-auto">
                <span className="hidden sm:inline">Upgrade</span>
                <span className="sm:hidden">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="payments" data-tab="payments" className="text-xs sm:text-sm h-8 sm:h-auto">
                <span className="hidden sm:inline">Payment Methods</span>
                <span className="sm:hidden">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="history" data-tab="history" className="text-xs sm:text-sm h-8 sm:h-auto">
                <span className="hidden sm:inline">Billing History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="current" className="space-y-6">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : currentSubscription?.subscription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Active Subscription
                  </CardTitle>
                  <CardDescription>
                    Your current plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                      <div className="font-semibold">
                        <Badge variant={currentSubscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                          {currentSubscription.subscription.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</div>
                      <div className="font-semibold capitalize">{currentSubscription.subscription.billingCycle}</div>
                    </div>
                    <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg sm:col-span-2 lg:col-span-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Next Billing</div>
                      <div className="font-semibold">
                        {new Date(currentSubscription.subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {currentSubscription.onTrial && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Trial Period Active
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        You have {currentSubscription.trialDaysLeft} days left in your trial period.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('plans')}
                      className="w-full sm:w-auto"
                    >
                      Change Plan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
                          cancelSubscriptionMutation.mutate();
                        }
                      }}
                      disabled={cancelSubscriptionMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {cancelSubscriptionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Subscription"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Choose a plan to get started with Travel CRM
                  </p>
                  <Button onClick={() => setActiveTab('plans')}>
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('monthly')}
                className="w-full sm:w-auto"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('yearly')}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Yearly (Save 20%)</span>
                <span className="sm:hidden">Yearly</span>
              </Button>
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-blue-600' : ''}`}>
                    {plan.name === 'Professional' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="text-3xl font-bold">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(parseFloat(plan.yearlyPrice) / 12).toString()}
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          /month{billingCycle === 'yearly' ? ' (billed yearly)' : ''}
                        </span>
                        {billingCycle === 'yearly' && (
                          <div className="text-sm text-green-600 font-medium">
                            Save ${(parseFloat(plan.monthlyPrice) * 12 - parseFloat(plan.yearlyPrice)).toFixed(0)} per year
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          // Show payment form by scrolling to it
                          setTimeout(() => {
                            const paymentForm = document.querySelector('[data-payment-form]');
                            paymentForm?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        disabled={currentSubscription?.subscription?.planId === plan.id}
                      >
                        {currentSubscription?.subscription?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedPlan && (
              <Card data-payment-form>
                <CardHeader>
                  <CardTitle>Complete Your Subscription</CardTitle>
                  <CardDescription>
                    {(() => {
                      const plan = plans.find(p => p.id === selectedPlan);
                      const price = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.yearlyPrice;
                      return `Subscribe to ${plan?.name} for $${price}/${billingCycle === 'monthly' ? 'month' : 'year'}`;
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      variant={paymentGateway === 'stripe' ? 'default' : 'outline'}
                      onClick={() => setPaymentGateway('stripe')}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Stripe
                    </Button>
                    <Button
                      variant={paymentGateway === 'razorpay' ? 'default' : 'outline'}
                      onClick={() => setPaymentGateway('razorpay')}
                      className="w-full sm:w-auto"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Razorpay
                    </Button>
                  </div>

                  <div className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <span className="text-lg font-medium">Start 14-Day Free Trial</span>
                      <Button 
                        onClick={() => {
                          if (selectedPlan) {
                            createSubscriptionMutation.mutate({
                              planId: selectedPlan,
                              billingCycle,
                              paymentGateway,
                            });
                          }
                        }}
                        disabled={createSubscriptionMutation.isPending}
                        className="w-full sm:w-32"
                      >
                        {createSubscriptionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No payment required. Your trial will automatically convert to a paid subscription after 14 days.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your saved payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {methodsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method: any) => (
                      <div key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg gap-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">
                              {method.brand} •••• {method.last4}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                          {method.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No payment methods
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add a payment method to manage your subscription
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past payments and download receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((payment: any) => (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg gap-3">
                        <div>
                          <div className="font-medium">
                            ${payment.amount} {payment.currency}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()} • {payment.paymentMethod}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                          <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                            {payment.status}
                          </Badge>
                          {payment.receiptUrl && (
                            <Button variant="outline" size="sm" asChild className="w-auto">
                              <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Receipt</span>
                                <span className="sm:hidden">📄</span>
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No billing history
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your payment history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}