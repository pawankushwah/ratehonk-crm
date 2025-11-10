import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, MessageCircle, Phone, Mail, FileText, Video, 
  Book, HelpCircle, CheckCircle, Clock, AlertCircle,
  ExternalLink, Download, Star, Users, Zap, Shield, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I set up my travel business on the platform?",
        answer: "Start by completing your company profile in Settings > Company Settings. Add your business information, contact details, and preferred timezone. Then configure your travel packages and import your existing customer data."
      },
      {
        question: "How do I import my existing customer data?",
        answer: "Go to Customers > Import Data. You can upload CSV files with customer information. Our system supports common formats and will guide you through the mapping process."
      },
      {
        question: "How do I create my first travel package?",
        answer: "Navigate to Travel Packages > Add New Package. Include destination details, pricing, duration, and any special features. You can also add photos and detailed itineraries."
      }
    ]
  },
  {
    category: "Lead Management",
    questions: [
      {
        question: "How does the lead scoring system work?",
        answer: "Our AI-powered lead scoring evaluates leads based on 6 factors: source quality (20%), engagement level (25%), demographics (15%), behavior tracking (20%), timeline urgency (10%), and budget indicators (10%). Scores range from 0-100."
      },
      {
        question: "How can I sync leads from social media?",
        answer: "Use the Lead Sync feature to connect your Facebook, Instagram, LinkedIn, and Twitter accounts. Leads will automatically import with source tracking and engagement metrics."
      },
      {
        question: "What's the difference between leads and customers?",
        answer: "Leads are potential customers who have shown interest but haven't made a purchase. Once a lead books a package or makes a payment, they can be converted to a customer with full booking history."
      }
    ]
  },
  {
    category: "Email Marketing",
    questions: [
      {
        question: "How do I set up email campaigns?",
        answer: "Go to Email Campaigns > Create Campaign. Choose your template, target audience, and schedule. You can create welcome sequences, promotional campaigns, or follow-up emails."
      },
      {
        question: "What is A/B testing and how do I use it?",
        answer: "A/B testing lets you compare different email versions to see which performs better. Test subject lines, content, or send times. The system automatically sends the winning version to your remaining audience."
      },
      {
        question: "How can I segment my email lists?",
        answer: "Use Email Segments to group customers by travel preferences, booking history, location, or custom criteria. This allows for more targeted and personalized campaigns."
      }
    ]
  },
  {
    category: "Bookings & Payments",
    questions: [
      {
        question: "How do I process bookings and payments?",
        answer: "When a customer books a package, create a booking record with their details and payment information. You can track payment status, send confirmations, and manage booking modifications."
      },
      {
        question: "Can I create custom invoice templates?",
        answer: "Yes, go to Settings > Invoice Settings to customize your invoice templates with your branding, terms, and payment instructions."
      },
      {
        question: "How do I handle booking cancellations?",
        answer: "In the booking details, you can mark bookings as cancelled and process refunds according to your cancellation policy. The system will update all related records automatically."
      }
    ]
  }
];

const resourcesData = [
  {
    title: "Getting Started Guide",
    description: "Complete walkthrough for setting up your travel business",
    icon: Book,
    type: "Guide",
    time: "15 min read"
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides for key features",
    icon: Video,
    type: "Video",
    time: "30+ videos"
  },
  {
    title: "API Documentation",
    description: "Technical documentation for developers",
    icon: FileText,
    type: "Technical",
    time: "Reference"
  },
  {
    title: "Best Practices",
    description: "Tips and strategies for travel business success",
    icon: Star,
    type: "Guide",
    time: "10 min read"
  },
  {
    title: "Integration Guides",
    description: "Connect with popular travel and business tools",
    icon: Zap,
    type: "Integration",
    time: "5-20 min"
  },
  {
    title: "Security Guidelines",
    description: "Keep your customer data safe and secure",
    icon: Shield,
    type: "Security",
    time: "8 min read"
  }
];

const supportChannels = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: MessageCircle,
    availability: "24/7",
    responseTime: "< 2 minutes",
    action: "Start Chat"
  },
  {
    title: "Email Support",
    description: "Send detailed questions and get comprehensive answers",
    icon: Mail,
    availability: "24/7",
    responseTime: "< 4 hours",
    action: "Send Email"
  },
  {
    title: "Phone Support",
    description: "Speak directly with our support experts",
    icon: Phone,
    availability: "Mon-Fri 9AM-6PM",
    responseTime: "Immediate",
    action: "Call Now"
  },
  {
    title: "Community Forum",
    description: "Connect with other travel business owners",
    icon: Users,
    availability: "24/7",
    responseTime: "Community driven",
    action: "Visit Forum"
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    priority: "",
    message: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch FAQ data with search and category filters
  const { data: faqData = [], isLoading: faqLoading } = useQuery({
    queryKey: ["/api/support/faq", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      
      const url = `/api/support/faq${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch FAQ data");
      return response.json();
    }
  });

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/support/status"],
    queryFn: async () => {
      const response = await fetch("/api/support/status");
      if (!response.ok) throw new Error("Failed to fetch status");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof supportForm) => {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit ticket");
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Support ticket submitted",
        description: `Ticket #${data.ticketId} created. We'll get back to you within 4 hours.`,
      });
      setSupportForm({ subject: "", category: "", priority: "", message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting ticket",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTicketMutation.mutate(supportForm);
  };

  // Group FAQ data by category for display
  const groupedFAQs = Array.isArray(faqData) ? faqData.reduce((acc: any, faq: any) => {
    const category = faq.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {}) : {};

  const categories = Object.keys(groupedFAQs);

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Find answers, get help, and learn how to make the most of your Travel CRM
              </p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Scroll to contact tab
                const contactTab = document.querySelector('[value="contact"]') as HTMLElement;
                contactTab?.click();
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <Tabs defaultValue="faq" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="status">System Status</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="space-y-6">
              {/* Search and Filter */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Categories */}
              {faqLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading FAQ...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedFAQs).map(([categoryName, faqs]) => (
                    <Card key={categoryName}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-blue-600" />
                          {categoryName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(faqs as any[]).map((faq: any, index: number) => (
                          <div key={faq.id || index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              {faq.question}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                  {Object.keys(groupedFAQs).length === 0 && !faqLoading && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No FAQs found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your search terms or category filter.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resourcesData.map((resource, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <resource.icon className="w-8 h-8 text-blue-600" />
                        <Badge variant="secondary">{resource.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {resource.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{resource.time}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Opening resource",
                              description: `${resource.title} will open in a new window.`,
                            });
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Downloads</CardTitle>
                  <CardDescription>Essential resources for your travel business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        toast({
                          title: "Download started",
                          description: "Customer Import Template downloading...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Customer Import Template
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        toast({
                          title: "Download started",
                          description: "Travel Package Template downloading...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Travel Package Template
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        toast({
                          title: "Download started",
                          description: "Email Campaign Guide downloading...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Email Campaign Guide
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        toast({
                          title: "Download started",
                          description: "API Integration Guide downloading...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      API Integration Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Support Channels */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Support Channels</h2>
                  {supportChannels.map((channel, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <channel.icon className="w-6 h-6 text-blue-600" />
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {channel.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {channel.description}
                              </p>
                              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <span>Available: {channel.availability}</span>
                                <span>Response: {channel.responseTime}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: `${channel.title} activated`,
                                description: `Opening ${channel.title.toLowerCase()} support channel.`,
                              });
                            }}
                          >
                            {channel.action}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Contact Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Submit a Support Request</CardTitle>
                    <CardDescription>
                      Can't find what you're looking for? Send us a message and we'll help you out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subject
                          </label>
                          <Input
                            value={supportForm.subject}
                            onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                            placeholder="Brief description of your issue"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Category
                            </label>
                            <select
                              value={supportForm.category}
                              onChange={(e) => setSupportForm({...supportForm, category: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              required
                            >
                              <option value="">Select category</option>
                              <option value="technical">Technical Issue</option>
                              <option value="billing">Billing & Payments</option>
                              <option value="feature">Feature Request</option>
                              <option value="integration">Integration Help</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Priority
                            </label>
                            <select
                              value={supportForm.priority}
                              onChange={(e) => setSupportForm({...supportForm, priority: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              required
                            >
                              <option value="">Select priority</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Message
                          </label>
                          <Textarea
                            value={supportForm.message}
                            onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                            placeholder="Please provide as much detail as possible about your issue..."
                            rows={5}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitTicketMutation.isPending}>
                          {submitTicketMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Support Request"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

            <TabsContent value="status" className="space-y-6">
              {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading status...</span>
                </div>
              ) : systemStatus ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        System Status - All Systems Operational
                      </CardTitle>
                      <CardDescription>
                        Last updated: {new Date(systemStatus.lastUpdated).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {systemStatus.services?.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.uptime} uptime
                            </span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {service.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Updates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {systemStatus.recentUpdates?.map((update: any, index: number) => (
                        <div key={index} className="flex gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-600 mt-1" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {update.title}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(update.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {update.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Unable to load system status
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Please try refreshing the page or contact support.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    );
  }