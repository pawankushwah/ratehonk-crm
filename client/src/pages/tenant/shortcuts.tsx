import { Layout } from "@/components/layout/layout";
import { Link, useLocation } from "wouter";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  ArrowLeft,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  Globe,
  Video,
  Phone,
  MapPin,
} from "lucide-react";
import { FaGoogle, FaWhatsapp } from "react-icons/fa";
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
  itineraries: {
    name: "Itinerary Builder",
    href: "/itineraries",
    icon: MapPin,
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

// Custom Twitter/X icon component
const TwitterIcon = ({ className }: { className?: string }) => (
  <div className={`${className || 'h-10 w-10'} bg-black text-white rounded-sm flex items-center justify-center text-xs font-bold`}>
    X
  </div>
);

// Custom Gmail icon component - multicolored M logo
const GmailIcon = ({ className }: { className?: string }) => (
  <div className={className || 'h-10 w-10 flex items-center justify-center'}>
    <FaGoogle className="h-full w-full" style={{ color: '#EA4335' }} />
  </div>
);

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <div className={className || 'h-10 w-10 flex items-center justify-center'}>
    <FaWhatsapp className="h-full w-full" style={{ color: '#25D366' }} />
  </div>
);

// Custom Zoom icon component
const ZoomIcon = ({ className }: { className?: string }) => (
  <div className={className || 'h-10 w-10 flex items-center justify-center'}>
    <Phone className="h-full w-full" style={{ color: '#2D8CFF' }} />
  </div>
);

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <div className={`${className || 'h-10 w-10'} rounded-sm flex items-center justify-center text-white text-xs font-bold`} style={{ background: 'linear-gradient(to right, #FF0050, #00F2EA)' }}>
    TT
  </div>
);

// Canva icon - teal/cyan brand color
const CanvaIcon = ({ className }: { className?: string }) => (
  <div className={`${className || 'h-10 w-10'} rounded flex items-center justify-center text-white font-bold text-lg`} style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #7B2FDE 100%)' }}>
    C
  </div>
);

// Social media links with icons - icons sit directly on white card
// All links point to internal settings pages
const socialLinks = [
  {
    name: "Gmail",
    href: "/gmail-settings",
    icon: GmailIcon,
    isCustom: true,
  },
  {
    name: "Facebook",
    href: "/social-integrations",
    icon: Facebook,
    color: "text-blue-600",
    isCustom: false,
  },
  {
    name: "LinkedIn",
    href: "/coming-soon/linkedin",
    icon: Linkedin,
    color: "text-blue-700",
    isCustom: false,
  },
  {
    name: "Twitter",
    href: "/coming-soon/twitter",
    icon: TwitterIcon,
    isCustom: true,
  },
  {
    name: "WhatsApp",
    href: "/whatsapp-setup",
    icon: WhatsAppIcon,
    isCustom: true,
  },
  {
    name: "Zoom",
    href: "/zoom-settings",
    icon: ZoomIcon,
    isCustom: true,
  },
  {
    name: "TikTok",
    href: "/coming-soon/tiktok",
    icon: TikTokIcon,
    isCustom: true,
  },
  {
    name: "Canva",
    href: "/canva-setup",
    icon: CanvaIcon,
    isCustom: true,
  },
];

export default function Shortcuts() {
  const [, setLocation] = useLocation();
  const { canView } = usePermissions();

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

  const handleBack = () => {
    setLocation("/dashboard");
  };

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        {/* Full width container */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>

          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quick Shortcuts
            </h1>
            <p className="text-gray-600">
              Click any icon to navigate to your desired page
            </p>
          </div>

          {/* Social Links Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Social Links
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="group flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    {/* White background only on icon */}
                    <div className="w-20 h-20 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
                        {social.isCustom ? (
                          <Icon className="h-10 w-10" />
                        ) : (
                          <Icon className={`h-10 w-10 ${social.color}`} />
                        )}
                      </div>
                    </div>
                    {/* Text outside white background */}
                    <span className="text-sm font-medium text-gray-900 text-center">
                      {social.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Application Shortcuts Section - Commented out for future use */}
          {false && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Application Shortcuts
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {availableShortcuts.map((shortcut) => {
                  const Icon = shortcut.icon;
                  return (
                    <Link 
                      key={shortcut.key} 
                      href={shortcut.href} 
                      className="group flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                      <div className="w-20 h-20 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-10 w-10 text-blue-600" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 text-center leading-tight">
                        {shortcut.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {availableShortcuts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No shortcuts available based on your permissions.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
