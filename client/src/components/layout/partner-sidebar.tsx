import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { usePartnerAuth } from "@/components/auth/partner-auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart3, Building2, CreditCard, Package, ChevronRight, LogOut } from "lucide-react";
import Logo from "../../assets/RATEHONKLOGO.png";

const partnerMenuItems = [
  { name: "Dashboard", href: "/partner/dashboard", icon: BarChart3 },
  { name: "Tenants", href: "/partner/tenants", icon: Building2 },
  { name: "Plans", href: "/partner/plans", icon: Package },
  { name: "Subscriptions", href: "/partner/subscriptions", icon: CreditCard },
];

export function PartnerSidebar() {
  const [location] = useLocation();
  const { user, logout } = usePartnerAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/partner/dashboard" ? location === "/partner/dashboard" : location.startsWith(href);

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/partner/dashboard" className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="h-8 w-auto" />
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          <ChevronRight className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <TooltipProvider>
          {partnerMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                        active ? "bg-emerald-50 text-emerald-600 font-medium" : "text-gray-700 hover:bg-gray-50",
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

      <div className="border-t border-gray-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "P"}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-gray-500 truncate">{user?.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Partner Account</DropdownMenuLabel>
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
