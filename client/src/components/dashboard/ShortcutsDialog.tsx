import React from "react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  Users,
  Filter,
  Calendar,
  FileText,
  CreditCard,
  Package,
  Mail,
  Building2,
  MessageSquare,
  UsersIcon,
  Crown,
  CheckSquare,
  Target,
  Settings,
  HelpCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MENU_ITEMS } from "@shared/permissions";

// Map of menu item IDs to their metadata (name, href, icon)
const menuItemsMap: Record<string, { name: string; href: string; icon: any }> = {
  dashboard: {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  leads: {
    name: "Leads",
    href: "/leads",
    icon: Filter,
  },
  customers: {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  calendar: {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  bookings: {
    name: "Bookings",
    href: "/bookings",
    icon: Calendar,
  },
  packages: {
    name: "Travel Packages",
    href: "/packages",
    icon: Package,
  },
  invoices: {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  estimates: {
    name: "Estimates",
    href: "/estimates",
    icon: FileText,
  },
  vendors: {
    name: "Vendors",
    href: "/vendors",
    icon: Building2,
  },
  expenses: {
    name: "Expenses",
    href: "/expenses",
    icon: CreditCard,
  },
  "email-campaigns": {
    name: "Email Campaigns",
    href: "/email-campaigns",
    icon: Mail,
  },
  "social-media": {
    name: "Social Media",
    href: "/social-integrations",
    icon: MessageSquare,
  },
  "travel-search-b2c": {
    name: "Travel Search (B2C)",
    href: "/travel-search-b2c",
    icon: Building2,
  },
  "travel-search-b2b": {
    name: "Travel Search (B2B)",
    href: "/travel-search-b2b",
    icon: Building2,
  },
  "whatsapp-messages": {
    name: "WhatsApp Messages",
    href: "/whatsapp-messages",
    icon: MessageSquare,
  },
  "whatsapp-setup": {
    name: "WhatsApp Setup",
    href: "/whatsapp-setup",
    icon: Settings,
  },
  "whatsapp-devices": {
    name: "WhatsApp Devices",
    href: "/whatsapp-devices",
    icon: MessageSquare,
  },
  "service-providers": {
    name: "Service Providers",
    href: "/service-providers",
    icon: Building2,
  },
  "gst-settings": {
    name: "GST/Tax Settings",
    href: "/gst-settings",
    icon: FileText,
  },
  tasks: {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  users: {
    name: "Users",
    href: "/users",
    icon: UsersIcon,
  },
  roles: {
    name: "Roles",
    href: "/roles",
    icon: Crown,
  },
  analytics: {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  reports: {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  "dynamic-fields": {
    name: "Dynamic Fields",
    href: "/dynamic-fields",
    icon: Zap,
  },
  settings: {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  "menu-ordering": {
    name: "Menu Customization",
    href: "/menu-ordering",
    icon: Settings,
  },
  support: {
    name: "Support",
    href: "/support",
    icon: HelpCircle,
  },
  subscription: {
    name: "Subscription",
    href: "/subscription",
    icon: CreditCard,
  },
  "automation-workflows": {
    name: "Automation Workflows",
    href: "/automation-workflows",
    icon: Zap,
  },
  "lead-types": {
    name: "Lead Categories",
    href: "/lead-types",
    icon: Filter,
  },
};

interface ShortcutsDialogProps {
  children: React.ReactNode;
}

export function ShortcutsDialog({ children }: ShortcutsDialogProps) {
  const [, setLocation] = useLocation();
  const { canView } = usePermissions();
  const [open, setOpen] = React.useState(false);

  // Filter menu items based on permissions (exclude dashboard widgets)
  const availableShortcuts = Object.entries(MENU_ITEMS)
    .filter(([key]) => {
      // Exclude dashboard widget permissions (they start with "dashboard.")
      if (key.startsWith("dashboard.")) return false;
      
      // Check if user has view permission for this page
      return canView(key);
    })
    .map(([key]) => {
      const menuItem = menuItemsMap[key];
      if (!menuItem) return null;
      
      return {
        key,
        name: menuItem.name,
        href: menuItem.href,
        icon: menuItem.icon,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleShortcutClick = (href: string) => {
    setLocation(href);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[1400px] max-h-[500px] overflow-y-auto p-4" 
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Quick Shortcuts</h3>
          <p className="text-xs text-gray-500 mt-1">Click any icon to navigate</p>
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {availableShortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Tooltip key={shortcut.key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleShortcutClick(shortcut.href)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all duration-200 group cursor-pointer min-h-[90px]"
                    >
                      <Icon className="h-10 w-10 text-gray-600 group-hover:text-blue-600 mb-2 transition-colors" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center line-clamp-2 leading-tight">
                        {shortcut.name}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{shortcut.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
        {availableShortcuts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No shortcuts available based on your permissions.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

