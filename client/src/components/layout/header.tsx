import { Bell, ChevronDown, Plane, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface HeaderProps {
  onReorderMenuItems?: () => void;
}

export function Header({ onReorderMenuItems }: HeaderProps = {}) {
  const { user, tenant, logout } = useAuth();
  
  // Fetch tenant settings to get company logo
  const { data: tenantSettings } = useQuery({
    queryKey: ["/api/tenant/settings"],
    enabled: !!tenant
  });

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40 w-full">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {(tenantSettings as any)?.companyLogo ? (
              <img
                src={(tenantSettings as any)?.companyLogo}
                alt="Company Logo"
                className="h-10 w-auto object-contain max-w-32"
              />
            ) : (
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {(tenantSettings as any)?.companyName || (tenant as any)?.name || "RateHonk CRM"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <NotificationBell />

          {onReorderMenuItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReorderMenuItems}
              className="flex items-center gap-2"
              title="Reorder Menu Items"
            >
              <Layout className="h-5 w-5" />
              <span className="hidden sm:inline">Reorder Menu</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium hidden sm:block">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Account</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
