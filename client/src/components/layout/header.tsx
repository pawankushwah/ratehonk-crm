import React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  Settings,
  Bell,
  HelpCircle,
  Building2,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const { user, tenant, logout } = useAuth();

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
  const userRole = (user as any)?.roleName || (user as any)?.role || "User";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - can be used for breadcrumbs or page title */}
        <div className="flex items-center gap-4">
          {/* Add breadcrumbs or page title here if needed */}
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          {/* Notifications bell */}
          <NotificationBell />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-3 px-2 py-2 hover:bg-gray-100"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userProfileImage} alt={userName} />
                  <AvatarFallback className="bg-[#0EA5E9] text-white font-medium text-sm">
                    {userName.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-gray-900">
                    {userName}
                  </span>
                  <span className="text-xs text-gray-500">{userRole}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-lg shadow-lg"
            >
              <DropdownMenuLabel className="font-medium">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{(tenant as any)?.companyName || (tenant as any)?.name || "My Account"}</span>
                  </div>
                  <div className="text-xs font-normal text-gray-500 mt-1">
                    {userEmail}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>System Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
