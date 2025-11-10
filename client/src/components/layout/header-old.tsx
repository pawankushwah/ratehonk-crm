import { Bell, ChevronDown, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/auth-provider";

export function Header() {
  const { user, tenant, logout } = useAuth();

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40 w-full">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile sidebar trigger */}
          <SidebarTrigger className="md:hidden" />
          
          <div className="flex items-center gap-3">
            {tenant?.logo ? (
              <img 
                src={tenant.logo} 
                alt={`${tenant.companyName} logo`}
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <Plane className="h-6 w-6 text-primary" />
            )}
            <span className="text-xl font-bold text-foreground hidden sm:block">
              {tenant?.companyName || 'RateHonk CRM'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
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
              <DropdownMenuItem onClick={logout}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
