import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Facebook, Instagram, Linkedin, Settings, Save, Send, Calendar, BarChart3,
  CheckCircle, XCircle, RefreshCw, ExternalLink, MessageSquare, Image, Video,
  AlertCircle, Key, Shield, Zap, TrendingUp, Target, Users, Clock, Eye,
  Heart, Share, MessageCircle, Play, Edit, Trash2, Plus, Filter, Download
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for unified social media data
interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | 'carousel';
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  analytics?: any;
}

interface SocialMessage {
  id: string;
  platform: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string;
  attachments?: string[];
}

interface SocialAnalytics {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  periodChange: {
    followers: number;
    engagement: number;
    reach: number;
  };
}

interface SocialLead {
  id: string;
  platform: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  formName?: string;
  createdAt: string;
  fields: Record<string, any>;
}

export default function UnifiedSocialDashboard() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']);
  const [activeTab, setActiveTab] = useState('overview');
  const [postFilter, setPostFilter] = useState('all');
  const [messageFilter, setMessageFilter] = useState('unread');

  // Fetch connected platforms
  const { data: connectedPlatforms = [], isLoading: isLoadingPlatforms } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/social/connected-platforms`],
    enabled: !!tenant?.id,
  });

  // Fetch unified posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<SocialPost[]>({
    queryKey: [`/api/tenants/${tenant?.id}/social/posts`, postFilter],
    enabled: !!tenant?.id,
  });

  // Fetch unified messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<SocialMessage[]>({
    queryKey: [`/api/tenants/${tenant?.id}/social/messages`, messageFilter],
    enabled: !!tenant?.id,
  });

  // Fetch unified analytics
  const { data: analytics = [], isLoading: isLoadingAnalytics } = useQuery<SocialAnalytics[]>({
    queryKey: [`/api/tenants/${tenant?.id}/social/analytics`],
    enabled: !!tenant?.id,
  });

  // Fetch unified leads
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<SocialLead[]>({
    queryKey: [`/api/tenants/${tenant?.id}/social/leads`],
    enabled: !!tenant?.id,
  });

  // Post creation/scheduling mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social/posts`, postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social/posts`] });
      toast({
        title: "Post Created!",
        description: "Your social media post has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  // Message reply mutation
  const replyToMessageMutation = useMutation({
    mutationFn: async ({ messageId, reply }: { messageId: string; reply: string }) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social/messages/${messageId}/reply`, { reply });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social/messages`] });
      toast({
        title: "Reply Sent!",
        description: "Your reply has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  // Sync data mutation
  const syncDataMutation = useMutation({
    mutationFn: async (platforms: string[]) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social/sync`, { platforms });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social`] });
      toast({
        title: "Sync Complete!",
        description: `Synced data from ${data.platformCount} platforms.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync social media data",
        variant: "destructive",
      });
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'twitter': return () => <div className="w-5 h-5 bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold">X</div>;
      case 'tiktok': return () => <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">TT</div>;
      default: return Settings;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-100 text-blue-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'twitter': return 'bg-gray-100 text-gray-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Media Hub
            </h1>
            <p className="text-muted-foreground">
              Unified management for all your social media platforms
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => syncDataMutation.mutate(selectedPlatforms)}
              disabled={syncDataMutation.isPending}
              variant="outline"
            >
              {syncDataMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync All
            </Button>
            <CreatePostDialog />
          </div>
        </div>

        {/* Connected Platforms Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'].map((platform) => {
            const isConnected = connectedPlatforms.some((p: any) => p.platform === platform);
            const Icon = getPlatformIcon(platform);
            const analytics = isConnected ? analytics.find(a => a.platform === platform) : null;
            
            return (
              <Card key={platform} className={`${isConnected ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-8 w-8" />
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize">{platform}</h3>
                      {isConnected ? (
                        <div className="space-y-1">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                          {analytics && (
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(analytics.followers)} followers
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(analytics.reduce((sum, a) => sum + a.followers, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(posts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {messages.filter(m => !m.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all platforms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {leads.filter(l => new Date(l.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentPosts posts={posts.slice(0, 5)} />
              <RecentMessages messages={messages.filter(m => !m.isRead).slice(0, 5)} />
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <PostsManagement 
              posts={posts} 
              filter={postFilter} 
              onFilterChange={setPostFilter}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <MessagesManagement 
              messages={messages}
              filter={messageFilter}
              onFilterChange={setMessageFilter}
              onReply={(messageId, reply) => replyToMessageMutation.mutate({ messageId, reply })}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard analytics={analytics} />
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <LeadsManagement leads={leads} />
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <SchedulingCalendar posts={posts.filter(p => p.status === 'scheduled')} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Component for creating new posts
function CreatePostDialog() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [postData, setPostData] = useState({
    content: '',
    platforms: [] as string[],
    mediaUrls: [] as string[],
    scheduledAt: '',
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social/posts`, data);
      return response.json();
    },
    onSuccess: () => {
      setIsOpen(false);
      setPostData({ content: '', platforms: [], mediaUrls: [], scheduledAt: '' });
      toast({
        title: "Post Created!",
        description: "Your post has been created successfully.",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Social Media Post</DialogTitle>
          <DialogDescription>
            Create and schedule posts across multiple platforms
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What's happening?"
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label>Select Platforms</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={platform}
                    checked={postData.platforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPostData(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                      } else {
                        setPostData(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                      }
                    }}
                  />
                  <label htmlFor={platform} className="text-sm capitalize">{platform}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="scheduledAt">Schedule For (Optional)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={postData.scheduledAt}
              onChange={(e) => setPostData(prev => ({ ...prev, scheduledAt: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createPostMutation.mutate(postData)}
            disabled={!postData.content || postData.platforms.length === 0 || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {postData.scheduledAt ? 'Schedule Post' : 'Publish Now'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component for recent posts display
function RecentPosts({ posts }: { posts: SocialPost[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2" />
          Recent Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length > 0 ? posts.map((post) => {
          const Icon = (() => {
            switch (post.platform) {
              case 'facebook': return Facebook;
              case 'instagram': return Instagram;
              case 'linkedin': return Linkedin;
              default: return Settings;
            }
          })();
          
          return (
            <div key={post.id} className="flex items-start space-x-3 border-b pb-3 last:border-b-0">
              <Icon className="h-5 w-5 mt-1" />
              <div className="flex-1">
                <p className="text-sm">{post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Heart className="h-3 w-3 mr-1" />
                    {post.engagement.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {post.engagement.comments}
                  </span>
                  <span className="flex items-center">
                    <Share className="h-3 w-3 mr-1" />
                    {post.engagement.shares}
                  </span>
                </div>
              </div>
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status}
              </Badge>
            </div>
          );
        }) : (
          <p className="text-muted-foreground text-center py-4">No recent posts</p>
        )}
      </CardContent>
    </Card>
  );
}

// Component for recent messages display
function RecentMessages({ messages }: { messages: SocialMessage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Unread Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length > 0 ? messages.map((message) => {
          const Icon = (() => {
            switch (message.platform) {
              case 'facebook': return Facebook;
              case 'instagram': return Instagram;
              case 'linkedin': return Linkedin;
              default: return Settings;
            }
          })();
          
          return (
            <div key={message.id} className="flex items-start space-x-3 border-b pb-3 last:border-b-0">
              <Icon className="h-5 w-5 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{message.from}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.content.length > 80 ? message.content.substring(0, 80) + '...' : message.content}</p>
              </div>
            </div>
          );
        }) : (
          <p className="text-muted-foreground text-center py-4">No unread messages</p>
        )}
      </CardContent>
    </Card>
  );
}

// Posts Management Component
function PostsManagement({ posts, filter, onFilterChange }: { 
  posts: SocialPost[], 
  filter: string, 
  onFilterChange: (filter: string) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Posts Management</h2>
        <div className="flex items-center space-x-2">
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

// Individual Post Card Component
function PostCard({ post }: { post: SocialPost }) {
  const Icon = (() => {
    switch (post.platform) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      default: return Settings;
    }
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <Badge variant="outline" className="capitalize">
              {post.platform}
            </Badge>
          </div>
          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
            {post.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
        
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground">
            {post.mediaType === 'video' ? (
              <Video className="h-3 w-3 mr-1" />
            ) : (
              <Image className="h-3 w-3 mr-1" />
            )}
            {post.mediaUrls.length} media file(s)
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {post.engagement.likes}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {post.engagement.comments}
            </span>
            <span className="flex items-center">
              <Share className="h-3 w-3 mr-1" />
              {post.engagement.shares}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {post.publishedAt && (
          <div className="text-xs text-muted-foreground">
            Published: {new Date(post.publishedAt).toLocaleDateString()}
          </div>
        )}
        
        {post.scheduledAt && post.status === 'scheduled' && (
          <div className="text-xs text-muted-foreground">
            Scheduled: {new Date(post.scheduledAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Messages Management Component
function MessagesManagement({ 
  messages, 
  filter, 
  onFilterChange, 
  onReply 
}: { 
  messages: SocialMessage[], 
  filter: string, 
  onFilterChange: (filter: string) => void,
  onReply: (messageId: string, reply: string) => void
}) {
  const [selectedMessage, setSelectedMessage] = useState<SocialMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messages Management</h2>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-3">
            {messages.map((message) => {
              const Icon = (() => {
                switch (message.platform) {
                  case 'facebook': return Facebook;
                  case 'instagram': return Instagram;
                  case 'linkedin': return Linkedin;
                  default: return Settings;
                }
              })();

              return (
                <div 
                  key={message.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  } ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{message.from}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {message.content.length > 60 ? message.content.substring(0, 60) + '...' : message.content}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Message Detail & Reply */}
        <Card>
          <CardHeader>
            <CardTitle>Message Details & Reply</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {(() => {
                      switch (selectedMessage.platform) {
                        case 'facebook': return <Facebook className="h-4 w-4" />;
                        case 'instagram': return <Instagram className="h-4 w-4" />;
                        case 'linkedin': return <Linkedin className="h-4 w-4" />;
                        default: return <Settings className="h-4 w-4" />;
                      }
                    })()}
                    <span className="font-medium">{selectedMessage.from}</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedMessage.platform}
                    </Badge>
                  </div>
                  <p className="text-sm">{selectedMessage.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Label>Reply</Label>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={() => {
                      onReply(selectedMessage.id, replyText);
                      setReplyText('');
                    }}
                    disabled={!replyText.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a message to view details and reply
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ analytics }: { analytics: SocialAnalytics[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.map((platform) => {
          const Icon = (() => {
            switch (platform.platform) {
              case 'facebook': return Facebook;
              case 'instagram': return Instagram;
              case 'linkedin': return Linkedin;
              default: return Settings;
            }
          })();

          return (
            <Card key={platform.platform}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{platform.platform}</CardTitle>
                <Icon className="h-4 w-4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">{formatNumber(platform.followers)}</div>
                  <p className="text-xs text-muted-foreground">
                    Followers ({platform.periodChange.followers > 0 ? '+' : ''}{platform.periodChange.followers}%)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Engagement</span>
                    <span>{platform.engagement}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reach</span>
                    <span>{formatNumber(platform.reach)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impressions</span>
                    <span>{formatNumber(platform.impressions)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional analytics charts and insights can be added here */}
    </div>
  );
}

// Leads Management Component
function LeadsManagement({ leads }: { leads: SocialLead[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Social Media Leads</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Leads
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Platform</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Source</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const Icon = (() => {
                    switch (lead.platform) {
                      case 'facebook': return Facebook;
                      case 'instagram': return Instagram;
                      case 'linkedin': return Linkedin;
                      default: return Settings;
                    }
                  })();

                  return (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{lead.platform}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4">{lead.email || 'N/A'}</td>
                      <td className="p-4">{lead.source}</td>
                      <td className="p-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Scheduling Calendar Component
function SchedulingCalendar({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Content Scheduling</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.length > 0 ? posts.map((post) => {
              const Icon = (() => {
                switch (post.platform) {
                  case 'facebook': return Facebook;
                  case 'instagram': return Instagram;
                  case 'linkedin': return Linkedin;
                  default: return Settings;
                }
              })();

              return (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{post.content.substring(0, 50)}...</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(post.scheduledAt!).toLocaleString()}</span>
                        <Badge variant="outline" className="capitalize">
                          {post.platform}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-muted-foreground text-center py-8">
                No scheduled posts
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}