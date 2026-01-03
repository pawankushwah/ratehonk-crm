import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
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
  BarChart3,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Package,
  TrendingUp,
  Users,
  Calendar,
  Bell,
  FileText,
  DollarSign,
  Activity,
  PieChart,
} from "lucide-react";
// import Logo from "../../assets/Logo-sidebar.svg";
import Logo from "../../assets/RATEHONKLOGO.png";

const saasMenuItems = [
  {
    name: "Dashboard",
    href: "/saas/dashboard",
    icon: BarChart3,
    group: null,
  },
  {
    name: "Tenants",
    href: "/saas/tenants",
    icon: Building2,
    group: null,
  },
  {
    name: "Subscription Plans",
    href: "/saas/plans",
    icon: Package,
    group: null,
  },
  {
    name: "Subscriptions",
    href: "/saas/subscriptions",
    icon: CreditCard,
    group: null,
  },
  {
    name: "Billing",
    href: "/saas/billing",
    icon: DollarSign,
    group: null,
  },
  {
    name: "Analytics",
    href: "/saas/analytics",
    icon: TrendingUp,
    group: null,
  },
  {
    name: "Reports",
    href: "/saas/reports",
    icon: FileText,
    group: null,
  },
  {
    name: "Settings",
    href: "/saas/settings",
    icon: Settings,
    group: null,
  },
];

export function SaasSidebar() {
  const [location] = useLocation();
  const { user, logout } = useSaasAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/saas/dashboard") {
      return location === "/saas/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/saas/dashboard" className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="h-8 w-auto" />
            {/* <span className="font-bold text-lg">SaaS Admin</span> */}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-180" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <TooltipProvider>
          {saasMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                        active
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-50",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm">{item.name}</span>}
                    </div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0] || "A"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/saas/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

