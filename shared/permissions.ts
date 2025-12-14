// Auto-sync permission system that dynamically generates from sidebar menu items
import { 
  BarChart3, Users, MessageSquare, CheckSquare, Filter, RefreshCw, Share2, 
  Calendar, Package, FileText, Mail, Zap, Target, Settings, Crown, Palette,
  Building2, CreditCard, MessageCircle, Smartphone, Plane, Globe, Wrench,
  Receipt, UserCircle, Headphones, Workflow
} from "lucide-react";

// Core menu structure that auto-syncs with sidebar
export const MENU_ITEMS = {
  dashboard: { 
    name: "Dashboard", 
    icon: BarChart3, 
    actions: ["view"] 
  },
  // Dashboard widget permissions (granular control)
  "dashboard.revenue": {
    name: "Dashboard - Revenue Card",
    icon: BarChart3,
    actions: ["view"]
  },
  "dashboard.bookings": {
    name: "Dashboard - Bookings Card",
    icon: CheckSquare,
    actions: ["view"]
  },
  "dashboard.customers": {
    name: "Dashboard - Customers Card",
    icon: Users,
    actions: ["view"]
  },
  "dashboard.leads": {
    name: "Dashboard - Leads Card",
    icon: Target,
    actions: ["view"]
  },
  "dashboard.revenue-chart": {
    name: "Dashboard - Revenue Chart",
    icon: BarChart3,
    actions: ["view"]
  },
  "dashboard.profit-loss": {
    name: "Dashboard - Profit/Loss Card",
    icon: BarChart3,
    actions: ["view"]
  },
  "dashboard.expense-chart": {
    name: "Dashboard - Expense Chart",
    icon: CreditCard,
    actions: ["view"]
  },
  "dashboard.service-booking": {
    name: "Dashboard - Service Booking Chart",
    icon: CheckSquare,
    actions: ["view"]
  },
  "dashboard.service-provider": {
    name: "Dashboard - Service Provider Chart",
    icon: Building2,
    actions: ["view"]
  },
  "dashboard.vendor-booking": {
    name: "Dashboard - Vendor Booking Chart",
    icon: Building2,
    actions: ["view"]
  },
  "dashboard.invoice-status": {
    name: "Dashboard - Invoice Status Bar",
    icon: FileText,
    actions: ["view"]
  },
  "dashboard.marketing-seo": {
    name: "Dashboard - Marketing SEO Bar",
    icon: Mail,
    actions: ["view"]
  },
  "dashboard.sidebar-followups": {
    name: "Dashboard - Follow Ups List",
    icon: Target,
    actions: ["view"]
  },
  "dashboard.sidebar-customers": {
    name: "Dashboard - Customers List",
    icon: Users,
    actions: ["view"]
  },
  "dashboard.sidebar-bookings": {
    name: "Dashboard - Bookings List",
    icon: CheckSquare,
    actions: ["view"]
  },
  "dashboard.sidebar-contacts": {
    name: "Dashboard - Contacts List",
    icon: Users,
    actions: ["view"]
  },
  customers: { 
    name: "Customers", 
    
    icon: Users, 
    actions: ["view", "edit", "delete", "create"] 
  },
  leads: { 
    name: "Leads", 
    icon: Target, 
    actions: ["view", "edit", "delete", "create"] 
  },
  "lead-types": { 
    name: "Lead Categories", 
    icon: Filter, 
    actions: ["view", "edit", "delete", "create"] 
  },
  bookings: { 
    name: "Bookings", 
    icon: CheckSquare, 
    actions: ["view", "edit", "delete", "create"] 
  },
  packages: { 
    name: "Travel Packages", 
    icon: Package, 
    actions: ["view", "edit", "delete", "create"] 
  },
  invoices: { 
    name: "Invoices", 
    icon: FileText, 
    actions: ["view", "edit", "delete", "create"] 
  },
  "invoice-import": { 
    name: "Invoice Import", 
    icon: RefreshCw, 
    actions: ["view", "create"] 
  },
  vendors: { 
    name: "Vendors", 
    icon: Building2, 
    actions: ["view", "edit", "delete", "create"] 
  },
  expenses: { 
    name: "Expenses", 
    icon: CreditCard, 
    actions: ["view", "edit", "delete", "create"] 
  },
  calendar: { 
    name: "Calendar", 
    icon: Calendar, 
    actions: ["view", "edit", "create", "delete"] 
  },
  "email-campaigns": { 
    name: "Email Campaigns", 
    icon: Mail, 
    actions: ["view", "edit", "delete", "create"] 
  },
  "social-media": { 
    name: "Social Media", 
    icon: Share2, 
    actions: ["view", "edit", "create"] 
  },
  analytics: { 
    name: "Analytics", 
    icon: BarChart3, 
    actions: ["view"] 
  },
  reports: { 
    name: "Reports", 
    icon: FileText, 
    actions: ["view", "create"] 
  },
  "dynamic-fields": { 
    name: "Dynamic Fields", 
    icon: Zap, 
    actions: ["view", "edit", "delete", "create"] 
  },
  settings: { 
    name: "Settings", 
    icon: Settings, 
    actions: ["view", "edit"] 
  },
  "menu-ordering": { 
    name: "Menu Customization", 
    icon: Palette, 
    actions: ["view", "edit"] 
  },
  users: { 
    name: "User Management", 
    icon: Users, 
    actions: ["view", "edit", "delete", "create"] 
  },
  roles: { 
    name: "Role Management", 
    icon: Crown, 
    actions: ["view", "edit", "delete", "create"] 
  },
  "whatsapp-messages": { 
    name: "WhatsApp Messages", 
    icon: MessageCircle, 
    actions: ["view", "create"] 
  },
  "whatsapp-setup": { 
    name: "WhatsApp Setup", 
    icon: Settings, 
    actions: ["view", "edit"] 
  },
  "whatsapp-devices": { 
    name: "WhatsApp Devices", 
    icon: Smartphone, 
    actions: ["view", "create", "edit", "delete"] 
  },
  "travel-search-b2c": { 
    name: "Travel Search (B2C)", 
    icon: Plane, 
    actions: ["view"] 
  },
  "travel-search-b2b": { 
    name: "Travel Search (B2B)", 
    icon: Globe, 
    actions: ["view"] 
  },
  "service-providers": { 
    name: "Service Providers", 
    icon: Wrench, 
    actions: ["view", "create", "edit", "delete"] 
  },
  "gst-settings": { 
    name: "GST/Tax Settings", 
    icon: Receipt, 
    actions: ["view", "edit"] 
  },
  tasks: { 
    name: "Tasks", 
    icon: CheckSquare, 
    actions: ["view", "create", "edit", "delete"] 
  },
  support: { 
    name: "Support", 
    icon: Headphones, 
    actions: ["view", "create"] 
  },
  subscription: { 
    name: "Subscription", 
    icon: CreditCard, 
    actions: ["view", "edit"] 
  },
  "automation-workflows": { 
    name: "Automation Workflows", 
    icon: Workflow, 
    actions: ["view", "create", "edit", "delete"] 
  }
} as const;

// Permission action types
export type PermissionAction = "view" | "edit" | "create" | "delete";

// Permission checker utility
export function hasPermission(
  userPermissions: Record<string, string[]>, 
  page: string, 
  action: PermissionAction
): boolean {
  return userPermissions[page]?.includes(action) || false;
}

// Get all available pages for permission configuration
export function getAvailablePages() {
  return MENU_ITEMS;
}

// Auto-generate permission structure for new pages
export function generateDefaultPermissions(pageKey: string, pageName: string, actions: PermissionAction[]) {
  return {
    [pageKey]: {
      name: pageName,
      actions
    }
  };
}

// Owner role default permissions (full access to everything)
export function generateOwnerPermissions(): Record<string, string[]> {
  const permissions: Record<string, string[]> = {};
  
  Object.entries(MENU_ITEMS).forEach(([key, config]) => {
    permissions[key] = [...config.actions];
  });
  
  return permissions;
}