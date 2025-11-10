import { Link, useLocation } from "wouter";
import { 
  BarChart3, Users, Filter, Calendar, Package, 
  FileText, MessageSquare, CheckSquare, Settings, 
  HelpCircle, Crown, RefreshCw, Share2, Mail,
  Zap, Target, UsersIcon, CreditCard, ChevronDown,
  ChevronRight, Menu, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Single navigation items (non-grouped)
const singleNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

// Grouped navigation items
const groupedNavItems = [
  {
    groupName: "Customer Management",
    icon: Users,
    items: [
      { name: "Customers", href: "/customers", icon: Users, badge: "1,234" },
      { name: "Communications", href: "/communications", icon: MessageSquare },
      { name: "Tasks & Follow-ups", href: "/tasks", icon: CheckSquare },
    ]
  },
  {
    groupName: "Lead Management", 
    icon: Filter,
    items: [
      { name: "Leads", href: "/leads", icon: Filter, badge: "89" },
      { name: "Lead Sync", href: "/lead-sync", icon: RefreshCw },
      { name: "Social Media", href: "/social-integrations", icon: Share2 },
    ]
  },
  {
    groupName: "Booking Management",
    icon: Calendar,
    items: [
      { name: "Bookings", href: "/bookings", icon: Calendar, badge: "156" },
      { name: "Travel Packages", href: "/packages", icon: Package },
      { name: "Invoices", href: "/invoices", icon: FileText },
    ]
  },
  {
    groupName: "Email Marketing",
    icon: Mail,
    items: [
      { name: "Email Campaigns", href: "/email-campaigns", icon: Mail },
      { name: "Email Automations", href: "/email-automations", icon: Zap, badge: "New" },
      { name: "A/B Testing", href: "/email-ab-tests", icon: Target, badge: "Pro" },
      { name: "Email Segments", href: "/email-segments", icon: UsersIcon },
      { name: "Email Settings", href: "/email-settings", icon: Settings },
    ]
  },
  {
    groupName: "Reports",
    icon: BarChart3,
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ]
  }
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/support", icon: HelpCircle },
];



// Export sidebar components without provider (provider will be in layout)
export function AppSidebar() {
  const [location] = useLocation();
  const { user, tenant } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the current page
  useEffect(() => {
    const newOpenGroups: Record<string, boolean> = {};
    groupedNavItems.forEach(group => {
      const hasActivePage = group.items.some(item => location === item.href);
      if (hasActivePage) {
        newOpenGroups[group.groupName] = true;
      }
    });
    setOpenGroups(prev => ({ ...prev, ...newOpenGroups }));
  }, [location]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isActiveGroup = (group: any) => {
    return group.items.some((item: any) => location === item.href);
  };

  return (
    <SidebarPrimitive>
      <SidebarHeader className="p-4">
        {/* Company Logo Section */}
        <div className="flex items-center space-x-3 p-3 bg-sidebar-accent rounded-lg">
          {tenant?.logo ? (
            <img 
              src={tenant.logo} 
              alt={`${tenant.companyName} logo`}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {tenant?.companyName?.charAt(0) || 'T'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {tenant?.companyName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {tenant?.contactEmail}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* Single navigation items */}
            {singleNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild
                  isActive={location === item.href}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Grouped navigation items */}
            {groupedNavItems.map((group) => (
              <SidebarMenuItem key={group.groupName}>
                <SidebarMenuButton
                  onClick={() => toggleGroup(group.groupName)}
                  isActive={isActiveGroup(group)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <group.icon className="h-4 w-4 mr-2" />
                    <span>{group.groupName}</span>
                  </div>
                  {openGroups[group.groupName] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </SidebarMenuButton>
                {openGroups[group.groupName] && (
                  <SidebarMenuSub>
                    {group.items.map((item: any) => (
                      <SidebarMenuSubItem key={item.name}>
                        <SidebarMenuSubButton 
                          asChild
                          isActive={location === item.href}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Bottom navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Pricing Plan Details */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Professional Plan</span>
            <Badge variant="secondary" className="bg-blue-600 text-white">Active</Badge>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300 mb-2">
            23 days remaining
          </div>
          <Link href="/subscription">
            <button className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium">
              Manage Subscription →
            </button>
          </Link>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}

// SaaS Owner Sidebar (separate for admin functions)
export function SaasOwnerSidebar() {
  const [location] = useLocation();
  
  return (
    <SidebarPrimitive>
      <SidebarHeader className="p-4">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">SaaS Owner</span>
            <Badge variant="secondary" className="bg-purple-600 text-white">Admin</Badge>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-300">
            System Administrator
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/saas/dashboard"}>
                <Link href="/saas/dashboard">
                  <BarChart3 className="h-4 w-4" />
                  <span>SaaS Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/saas/tenants"}>
                <Link href="/saas/tenants">
                  <Users className="h-4 w-4" />
                  <span>Tenants</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/saas/plans"}>
                <Link href="/saas/plans">
                  <Package className="h-4 w-4" />
                  <span>Subscription Plans</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarPrimitive>
  );
}

// Main sidebar component that chooses between regular and SaaS owner
export function Sidebar() {
  const { user } = useAuth();
  const isSaasOwner = user?.role === "saas_owner";

  return isSaasOwner ? <SaasOwnerSidebar /> : <AppSidebar />;
}
