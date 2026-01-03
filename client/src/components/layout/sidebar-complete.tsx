import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  Users,
  Target,
  Calendar,
  Mail,
  Settings,
  Bot,
  FileText,
  LogOut,
  User,
  Building2,
  ChevronRight,
  Package,
  CreditCard,
  TrendingUp,
  Sparkles,
  Zap,
  HelpCircle,
  Menu,
  PanelLeftClose,
  PanelLeft,
  CheckSquare,
  Filter,
  Palette,
  RefreshCw,
  Share2,
  Crown,
  Layout,
  TestTube,
  MessageSquare,
  Users as UsersIcon,
  Bell,
  Receipt,
} from "lucide-react";
// import Logo from "../../assets/Logo-sidebar.svg";
import Logo from "../../assets/RATEHONKLOGO.png";

// Complete menu items from original sidebar
const allMenuItems = {
  dashboard: {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    group: null,
    badge: null,
    order: 1,
  },
  leads: {
    name: "Lead",
    href: "/leads",
    icon: Filter,
    group: null,
    badge: null,
    order: 2,
  },
  customers: {
    name: "Customer",
    href: "/customers",
    icon: Users,
    group: null,
    badge: null,
    order: 3,
  },
  calendar: {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    group: null,
    badge: null,
    order: 4,
  },
  estimates: {
    name: "Estimate",
    href: "/estimates",
    icon: FileText,
    group: "Invoice & Billing",
    badge: null,
    order: 4.3,
  },
  expenses: {
    name: "Expense",
    href: "/expenses",
    icon: CreditCard,
    group: null,
    badge: null,
    order: 4,
  },
  // tasks: {
  //   name: "Tasks & Follow-ups",
  //   href: "/tasks",
  //   icon: CheckSquare,
  //   group: null,
  //   badge: null,
  //   order: 8,
  // },
  // leads: {
  //   name: "Lead Pipeline",
  //   href: "/leads",
  //   icon: Filter,
  //   group: "Lead Management",
  //   badge: "89",
  //   order: 3,
  // },
  // "lead-types": {
  //   name: "Lead Categories",
  //   href: "/lead-types",
  //   icon: Palette,
  //   group: "Lead Management",
  //   badge: null,
  //   order: 3,
  // },
  // "lead-sync": {
  //   name: "Lead Import & Sync",
  //   href: "/lead-sync",
  //   icon: RefreshCw,
  //   group: "Lead Management",
  //   badge: null,
  //   order: 3,
  // },
  // "social-integrations": {
  //   name: "Social Media Hub",
  //   href: "/social-integrations",
  //   icon: Share2,
  //   group: "Lead Management",
  //   badge: null,
  //   order: 3,
  // },
  // "lead-analytics": {
  //   name: "Lead Analytics",
  //   href: "/lead-analytics",
  //   icon: TrendingUp,
  //   group: "Lead Management",
  //   badge: "New",
  //   order: 3,
  // },
  // calendar: {
  //   name: "Calendar",
  //   href: "/calendar",
  //   icon: Calendar,
  //   group: null,
  //   badge: null,
  //   order: 4,
  // },
  // bookings: {
  //   name: "Booking",
  //   href: "/bookings",
  //   icon: Calendar,
  //   group: null,
  //   badge: null,
  //   order: 4,
  // },
  packages: {
    name: "Travel Packages",
    href: "/packages",
    icon: Package,
    group: null,
    badge: null,
    order: 3.9,
  },
  invoices: {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
    group: "Invoice & Billing",
    badge: null,
    order: 4.1,
  },
  "supplier-management": {
    name: "Supplier Management",
    href: "/vendors",
    icon: Building2,
    group: "Invoice & Billing",
    badge: null,
    order: 4.2,
  },
  // estimates: {
  //   name: "Estimate Management",
  //   href: "/estimates",
  //   icon: FileText,
  //   group: "Booking & Sales",
  //   badge: null,
  //   order: 4,
  // },
  // vendors: {
  //   name: "Vendor Management",
  //   href: "/vendors",
  //   icon: Building2,
  //   group: "Booking & Sales",
  //   badge: null,
  //   order: 4,
  // },
  // expenses: {
  //   name: "Expense Management",
  //   href: "/expenses",
  //   icon: CreditCard,
  //   group: "Booking & Sales",
  //   badge: null,
  //   order: 4,
  // },
  // "booking-recommendations": {
  //   name: "AI Recommendations",
  //   href: "/booking-recommendations",
  //   icon: Sparkles,
  //   group: "Booking & Sales",
  //   badge: "AI",
  //   order: 4,
  // },
  "email-campaigns": {
    name: "Campaign Manager",
    href: "/email-campaigns",
    icon: Mail,
    group: null,
    badge: null,
    order: 6,
  },
  "email-templates": {
    name: "Email Templates",
    href: "/email-templates",
    icon: FileText,
    group: null,
    badge: null,
    order: 6.1,
  },
  // "email-campaigns": {
  //   name: "Campaign Manager",
  //   href: "/email-campaigns",
  //   icon: Mail,
  //   group: "Email Marketing",
  //   badge: null,
  //   order: 5,
  // },
  // "email-automations": {
  //   name: "Email Workflows",
  //   href: "/email-automations",
  //   icon: Zap,
  //   group: "Email Marketing",
  //   badge: "New",
  //   order: 5,
  // },
  // "email-ab-tests": {
  //   name: "A/B Testing",
  //   href: "/email-ab-tests",
  //   icon: Target,
  //   group: "Email Marketing",
  //   badge: "Pro",
  //   order: 5,
  // },
  // "email-segments": {
  //   name: "Audience Segments",
  //   href: "/email-segments",
  //   icon: UsersIcon,
  //   group: "Email Marketing",
  //   badge: null,
  //   order: 5,
  // },
  // "email-settings": {
  //   name: "Email Configuration",
  //   href: "/email-settings",
  //   icon: Settings,
  //   group: "Email Marketing",
  //   badge: null,
  //   order: 5,
  // },
  // "email-test": {
  //   name: "Email Testing",
  //   href: "/email-test",
  //   icon: TestTube,
  //   group: "Email Marketing",
  //   badge: "New",
  //   order: 5,
  // },
  // "gmail-emails": {
  //   name: "Gmail Integration",
  //   href: "/gmail-emails",
  //   icon: Mail,
  //   group: "Email Marketing",
  //   badge: "New",
  //   order: 5,
  // },
  // hotels: {
  //   name: "Hotels Overview",
  //   href: "/hotels",
  //   icon: Building2,
  //   group: "Hotel Management",
  //   badge: null,
  //   order: 4.5,
  // },
  //   hotels: {
  //   name: "Travel Search",
  //   href: "/hotels",
  //   icon: Building2,
  //   group: null,
  //   badge: null,
  //   order: 4.5,
  // },
  "travel-search-b2c": {
    name: "Travel Search",
    href: "/travel-search-b2c",
    icon: Building2,
    group: null,
    badge: null,
    order: 4.5,
  },
  // whatsapp: {
  //   name: "WhatsApp",
  //   href: "/whatsapp",
  //   icon: MessageSquare,
  //   group: null,
  //   badge: null,
  //   order: 4.6,
  // },
  "whatsapp-messages": {
    name: "WhatsApp Messages",
    href: "/whatsapp-messages",
    icon: MessageSquare,
    group: null,
    badge: "New",
    order: 4.7,
  },
  // "whatsapp-devices": {
  //   name: "WhatsApp Devices",
  //   href: "/whatsapp-devices",
  //   icon: MessageSquare,
  //   group: null,
  //   badge: "New",
  //   order: 4.8,
  // },
  // "whatsapp-setup": {
  //   name: "WhatsApp Setup",
  //   href: "/whatsapp-setup",
  //   icon: Settings,
  //   group: null,
  //   badge: null,
  //   order: 4.9,
  // },
  // "travel-search-b2b": {
  //   name: "Travel Search Agent",
  //   href: "/travel-search-b2b",
  //   icon: Building2,
  //   group: null,
  //   badge: null,
  //   order: 4.5,
  // },
  // "hotels-list": {
  //   name: "Flights",
  //   href: "/flights",
  //   icon: Building2,
  //   group: "Hotel Management",
  //   badge: null,
  //   order: 4.5,
  // },
  // "automation-workflows": {
  //   name: "Workflow Automation",
  //   href: "/automation-workflows",
  //   icon: Bot,
  //   group: null,
  //   badge: "Pro",
  //   order: 6,
  // },
  // reports: {
  //   name: "Analytics & Reports",
  //   href: "/reports",
  //   icon: BarChart3,
  //   group: null,
  //   badge: null,
  //   order: 7,
  // },
  users: {
    name: "Users",
    href: "/users",
    icon: UsersIcon,
    group: "User Management",
    badge: null,
    order: 8.1,
  },
  roles: {
    name: "Roles",
    href: "/roles",
    icon: Crown,
    group: "User Management",
    badge: "New",
    order: 8.2,
  },
  tasks: {
    name: "Tasks & Follow-ups",
    href: "/tasks",
    icon: CheckSquare,
    group: "User Management",
    badge: null,
    order: 8.3,
  },
  assignments: {
    name: "Assignments & Workload",
    href: "/assignments",
    icon: Target,
    group: "User Management",
    badge: null,
    order: 8.4,
  },
  performance: {
    name: "Performance Dashboard",
    href: "/performance",
    icon: TrendingUp,
    group: "User Management",
    badge: null,
    order: 8.5,
  },
  
  "menu-ordering": {
    name: "Menus Ordering",
    href: "/menu-ordering",
    icon: Layout,
    group: "Settings",
    badge: null,
    order: 9.5,
  },
  settings: {
    name: "Profile & Organization",
    href: "/settings",
    icon: Settings,
    group: "Settings",
    badge: null,
    order: 9.1,
  },
  subscription: {
    name: "Subscriptions",
    href: "/subscription",
    icon: Crown,
    group: "Settings",
    badge: null,
    order: 9.2,
  },
  "email-settings": {
    name: "Email Setting",
    href: "/email-settings",
    icon: Mail,
    group: "Settings",
    badge: null,
    order: 9.3,
  },
  "gst-settings": {
    name: "Tax Setting",
    href: "/gst-settings",
    icon: Receipt,
    group: "Settings",
    badge: null,
    order: 9.4,
  },
  support: {
    name: "Help & Support",
    href: "/support",
    icon: HelpCircle,
    group: null,
    badge: null,
    order: 10,
  },
};

interface SidebarProps {
  className?: string;
  initialCollapsed?: boolean;
}

export function CompleteSidebar({
  className,
  initialCollapsed = false,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [location] = useLocation();
  const { user, tenant, logout } = useAuth();
  const { canView, isLoading: permissionsLoading } = usePermissions();

  // User info with real data and fallbacks
  const userName =
    (user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`
      : (user as any)?.name ||
        (user as any)?.displayName ||
        (user as any)?.email?.split("@")[0] ||
        "User";
  const userEmail = (user as any)?.email || "user@example.com";
  const userProfileImage =
    (user as any)?.profileImage ||
    (user as any)?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;

  // Map menu item IDs to permission keys (some menu IDs differ from permission keys)
  const permissionKeyMap: Record<string, string> = {
    'supplier-management': 'vendors',
    'dynamic-fields': 'dynamic-fields',
    'settings': 'settings',
    'subscription': 'subscription',
    'email-settings': 'email-settings',
    'gst-settings': 'gst-settings',
    'menu-ordering': 'menu-ordering',
  };

  // Group menu items and filter by permissions
  const menuGroups = React.useMemo(() => {
    // Filter items based on permissions (only show if user has view permission)
    // While permissions are loading, show all items to prevent flickering
    const filteredItems = Object.entries(allMenuItems)
      .filter(([itemId, item]) => {
        // If permissions are loading, show all items
        if (permissionsLoading) return true;
        
        // Check if user has view permission for this menu item
        // Map menu item IDs to permission keys (some may differ)
        const permissionKey = permissionKeyMap[itemId] || itemId;
        
        // Check permission - if permission check returns true (including owner/admin), show item
        const hasPermission = canView(permissionKey);
        
        return hasPermission;
      })
      .map(([itemId, item]) => ({
        id: itemId,
        ...item,
        order: item.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order);

    const groups: { [key: string]: any[] } = {};
    const singleItems: any[] = [];

    filteredItems.forEach((item) => {
      if (item.group) {
        if (!groups[item.group]) {
          groups[item.group] = [];
        }
        groups[item.group].push(item);
      } else {
        singleItems.push(item);
      }
    });

    // Filter out empty groups
    const nonEmptyGroups = Object.entries(groups).filter(([_, items]) => items.length > 0);

    // Sort groups by the minimum order of items in each group
    const sortedGroups = nonEmptyGroups.sort(([groupA, itemsA], [groupB, itemsB]) => {
      const minOrderA = Math.min(...itemsA.map(item => item.order));
      const minOrderB = Math.min(...itemsB.map(item => item.order));
      return minOrderA - minOrderB;
    });

    // Create a combined list of all menu items (single items and groups) sorted by order
    const allMenuItemsSorted: Array<{ type: 'single' | 'group'; data: any; order: number }> = [];
    
    // Add single items
    singleItems.forEach(item => {
      allMenuItemsSorted.push({ type: 'single', data: item, order: item.order });
    });
    
    // Add groups (using minimum order of items in group)
    sortedGroups.forEach(([groupName, groupItems]) => {
      const minOrder = Math.min(...groupItems.map(item => item.order));
      allMenuItemsSorted.push({ type: 'group', data: { name: groupName, items: groupItems }, order: minOrder });
    });
    
    // Sort all items by order
    allMenuItemsSorted.sort((a, b) => a.order - b.order);

    return { groups: Object.fromEntries(sortedGroups), singleItems, allMenuItemsSorted };
  }, [canView, permissionsLoading]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedGroups([]); // Collapse all groups when sidebar is collapsed
    }

    // Update the main content margin based on sidebar state
    const mainContent = document.querySelector(".main-content-wrapper");
    if (mainContent) {
      if (!isCollapsed) {
        // Will be collapsed, so set margin for collapsed state
        (mainContent as HTMLElement).style.marginLeft = "4rem"; // 64px
      } else {
        // Will be expanded, so set margin for expanded state
        (mainContent as HTMLElement).style.marginLeft = "16rem"; // 256px
      }
    }
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((g) => g !== groupLabel)
        : [...prev, groupLabel],
    );
  };

  const isGroupExpanded = (groupLabel: string) => {
    return expandedGroups.includes(groupLabel);
  };

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + "/");
  };

  const hasActiveChildInGroup = (groupItems: any[]) => {
    return groupItems.some((item) => isActive(item.href));
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 border-r fixed top-0 left-0 z-50",
        isCollapsed ? "w-16" : "w-64",
        isCollapsed
          ? "bg-[#0EA5E9] border-[#0EA5E9]" // Blue background for collapsed
          : "bg-[#f1f4f9] border-gray-200", // Light gray-blue for expanded
        className,
      )}
      onMouseEnter={() => {
        if (isCollapsed) {
          setIsCollapsed(false);
          // Update the main content margin for expanded state
          const mainContent = document.querySelector(".main-content-wrapper");
          if (mainContent) {
            (mainContent as HTMLElement).style.marginLeft = "16rem"; // 256px
          }
        }
      }}
      onMouseLeave={() => {
        if (!isCollapsed) {
          setIsCollapsed(true);
          setExpandedGroups([]); // Close all popovers when mouse leaves sidebar
          // Update the main content margin for collapsed state
          const mainContent = document.querySelector(".main-content-wrapper");
          if (mainContent) {
            (mainContent as HTMLElement).style.marginLeft = "4rem"; // 64px
          }
        } else {
          setExpandedGroups([]); // Close all popovers when mouse leaves sidebar
        }
      }}
    >
      {/* Header with logo and menu button */}
      <div
        className={cn(
          "flex items-center px-4 py-4 border-b",
          isCollapsed
            ? "justify-center border-blue-600/20"
            : "justify-between border-gray-200",
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <img
              src={Logo}
              alt="RateHonk"
              className="h-8 w-auto object-contain"
            />
          </div>
        )}

        {/* Toggle button - always visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 p-0",
            isCollapsed
              ? "text-white hover:bg-white/10"
              : "text-gray-600 hover:bg-gray-200",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-none">
        <TooltipProvider delayDuration={0}>
          <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}>
            {/* All menu items sorted by order */}
            {menuGroups.allMenuItemsSorted.map((menuItem, index) => {
              if (menuItem.type === 'single') {
                const item = menuItem.data;
                const Icon = item.icon;
                const active = isActive(item.href);

                const menuButton = (
                  <Link key={index} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-11 transition-all duration-200 text-left",
                        isCollapsed ? "px-0" : "px-3",
                        active
                          ? isCollapsed
                            ? "bg-white/20 text-white"
                            : "bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90"
                          : isCollapsed
                            ? "text-white hover:bg-white/10"
                            : "text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center w-full" : "gap-3",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium text-sm">{item.name}</span>
                        )}
                      </div>
                    </Button>
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return menuButton;
              } else {
                // Group item
                const { name: groupName, items: groupItems } = menuItem.data;
                const isExpanded = isGroupExpanded(groupName);
                const hasActiveChild = hasActiveChildInGroup(groupItems);
                const firstItem = groupItems[0];
                const GroupIcon = firstItem ? firstItem.icon : BarChart3;

                const groupButton = (
                  <Button
                    variant="ghost"
                    onClick={() => toggleGroup(groupName)}
                    className={cn(
                      "w-full justify-between h-11 transition-all duration-200",
                      isCollapsed ? "px-0" : "px-3",
                      hasActiveChild
                        ? isCollapsed
                          ? "bg-white/20 text-white"
                          : "text-[#0EA5E9]"
                        : isCollapsed
                          ? "text-white hover:bg-white/10"
                          : "text-gray-700 hover:bg-gray-200",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center",
                        isCollapsed ? "justify-center w-full" : "gap-3",
                      )}
                    >
                      <GroupIcon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{groupName}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    )}
                  </Button>
                );

                const isPopoverOpen = isCollapsed && isGroupExpanded(groupName);

                return (
                  <div key={groupName}>
                    {isCollapsed ? (
                      <div
                        onMouseLeave={() => {
                          if (isCollapsed) {
                            setExpandedGroups((prev) =>
                              prev.filter((g) => g !== groupName)
                            );
                          }
                        }}
                      >
                        <Popover open={isPopoverOpen} onOpenChange={(open) => {
                          if (isCollapsed) {
                            if (open) {
                              setExpandedGroups((prev) =>
                                prev.includes(groupName)
                                  ? prev
                                  : [...prev, groupName]
                              );
                            } else {
                              setExpandedGroups((prev) =>
                                prev.filter((g) => g !== groupName)
                              );
                            }
                          }
                        }}>
                          <PopoverTrigger asChild>
                            <div
                              onMouseEnter={() => {
                                if (isCollapsed) {
                                  setExpandedGroups((prev) =>
                                    prev.includes(groupName)
                                      ? prev
                                      : [...prev, groupName]
                                  );
                                }
                              }}
                            >
                              {groupButton}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent 
                            side="right" 
                            align="start"
                            className="w-56 p-1"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onMouseEnter={() => {
                              if (isCollapsed) {
                                setExpandedGroups((prev) =>
                                  prev.includes(groupName)
                                    ? prev
                                    : [...prev, groupName]
                                );
                              }
                            }}
                          >
                          <div className="space-y-1">
                            {groupItems.map((child: any, childIndex: number) => {
                              const ChildIcon = child.icon;
                              const childActive = isActive(child.href);

                              return (
                                <Link key={childIndex} href={child.href}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start h-9 px-3 text-left transition-all duration-200",
                                      childActive
                                        ? "bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90"
                                        : "text-gray-700 hover:bg-gray-100",
                                    )}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      <ChildIcon className="h-4 w-4 shrink-0" />
                                      <span className="text-sm">{child.name}</span>
                                      {child.badge && (
                                        <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                          {child.badge}
                                        </span>
                                      )}
                                    </div>
                                  </Button>
                                </Link>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      </div>
                    ) : (
                      <div
                        onMouseLeave={() => {
                          if (!isCollapsed) {
                            setExpandedGroups((prev) =>
                              prev.filter((g) => g !== groupName)
                            );
                          }
                        }}
                      >
                        <Popover open={isExpanded} onOpenChange={(open) => {
                          if (!isCollapsed) {
                            if (open) {
                              setExpandedGroups((prev) =>
                                prev.includes(groupName)
                                  ? prev
                                  : [...prev, groupName]
                              );
                            } else {
                              setExpandedGroups((prev) =>
                                prev.filter((g) => g !== groupName)
                              );
                            }
                          }
                        }}>
                          <PopoverTrigger asChild>
                            <div
                              onMouseEnter={() => {
                                if (!isCollapsed) {
                                  setExpandedGroups((prev) =>
                                    prev.includes(groupName)
                                      ? prev
                                      : [...prev, groupName]
                                  );
                                }
                              }}
                            >
                              {groupButton}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent 
                            side="right" 
                            align="start"
                            className="w-56 p-1"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onMouseEnter={() => {
                              if (!isCollapsed) {
                                setExpandedGroups((prev) =>
                                  prev.includes(groupName)
                                    ? prev
                                    : [...prev, groupName]
                                );
                              }
                            }}
                          >
                          <div className="space-y-1">
                            {groupItems.map((child: any, childIndex: number) => {
                              const ChildIcon = child.icon;
                              const childActive = isActive(child.href);

                              return (
                                <Link key={childIndex} href={child.href}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start h-9 px-3 text-left transition-all duration-200",
                                      childActive
                                        ? "bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90"
                                        : "text-gray-700 hover:bg-gray-100",
                                    )}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      <ChildIcon className="h-4 w-4 shrink-0" />
                                      <span className="text-sm">{child.name}</span>
                                      {child.badge && (
                                        <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                          {child.badge}
                                        </span>
                                      )}
                                    </div>
                                  </Button>
                                </Link>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* User Profile Section with Settings Icon */}
      <div
        className={cn(
          "p-4 border-t",
          isCollapsed ? "border-blue-600/20" : "border-gray-200",
        )}
      >
        {isCollapsed ? (
          // Collapsed state - avatar with popover
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
              >
                <div className="flex justify-center w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfileImage} alt={userName} />
                    <AvatarFallback className="bg-white text-blue-600 font-medium text-sm">
                      {userName.charAt(0) || "H"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="start"
              className="w-56 p-0 rounded-lg shadow-lg"
            >
              <div className="py-2">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>System Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </Button>
                </div>
                <div className="border-t my-1"></div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9 px-3 text-left font-normal text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // Expanded state - user card with settings icon
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
              >
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 w-full hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userProfileImage} alt={userName} />
                      <AvatarFallback className="bg-[#0EA5E9] text-white font-medium">
                        {userName.charAt(0) || "H"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userEmail}
                      </p>
                    </div>
                    <Settings className="h-4 w-4 text-gray-400 shrink-0" />
                  </div>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="start"
              className="w-56 p-0 rounded-lg shadow-lg"
            >
              <div className="py-2">
                <div className="px-3 py-2 border-b">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {(tenant as any)?.companyName || (tenant as any)?.name || "My Account"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>System Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-left font-normal"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </Button>
                </div>
                <div className="border-t my-1"></div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9 px-3 text-left font-normal text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
