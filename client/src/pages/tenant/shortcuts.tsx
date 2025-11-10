import { Layout } from "@/components/layout/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "wouter";
import {
  RefreshCw,
  Palette,
  Share2,
  Package,
  FileText,
  Building2,
  Sparkles,
  Users,
  CheckSquare,
  Settings,
  Mail,
  Layout as LayoutIcon,
} from "lucide-react";

const shortcuts = [
  {
    name: "Lead Import & Sync",
    href: "/lead-sync",
    icon: RefreshCw,
    description: "Import and synchronize leads from various sources",
    color: "bg-blue-500",
  },
  {
    name: "Lead Categories",
    href: "/lead-types",
    icon: Palette,
    description: "Manage lead types and categories",
    color: "bg-purple-500",
  },
  {
    name: "Social Media Hub",
    href: "/social-integrations",
    icon: Share2,
    description: "Connect and manage social media platforms",
    color: "bg-pink-500",
  },
  {
    name: "Travel Packages",
    href: "/packages",
    icon: Package,
    description: "Create and manage travel packages",
    color: "bg-indigo-500",
  },
  {
    name: "Package Types",
    href: "/package-types",
    icon: Package,
    description: "Define different types of travel packages",
    color: "bg-cyan-500",
  },
  {
    name: "Invoices & Billing",
    href: "/invoices",
    icon: FileText,
    description: "Manage invoices and billing",
    color: "bg-green-500",
  },
  {
    name: "Vendor Management",
    href: "/vendors",
    icon: Building2,
    description: "Manage vendors and suppliers",
    color: "bg-orange-500",
  },
  {
    name: "AI Booking Recommendations",
    href: "/booking-recommendations",
    icon: Sparkles,
    description: "Get AI-powered booking suggestions",
    color: "bg-yellow-500",
  },
  {
    name: "Roles & Permissions",
    href: "/roles",
    icon: Users,
    description: "Manage user roles and permissions",
    color: "bg-red-500",
  },
  {
    name: "Tasks & Follow-ups",
    href: "/tasks",
    icon: CheckSquare,
    description: "Track tasks and follow-up activities",
    color: "bg-teal-500",
  },
  {
    name: "System Settings",
    href: "/settings",
    icon: Settings,
    description: "Configure system settings and preferences",
    color: "bg-gray-500",
  },
  {
    name: "Email Configuration",
    href: "/email-settings",
    icon: Mail,
    description: "Configure email settings and SMTP",
    color: "bg-blue-600",
  },
  {
    name: "Menu Ordering",
    href: "/menu-ordering",
    icon: LayoutIcon,
    description: "Customize sidebar menu order and visibility",
    color: "bg-violet-500",
  },
];

export default function Shortcuts() {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0BBCD6] to-blue-600 bg-clip-text text-transparent mb-2">
            Quick Shortcuts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access frequently used pages quickly from here
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href}>
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-t-2 h-full"
                style={{ borderTopColor: `var(--${shortcut.color})` }}
                data-testid={`shortcut-${shortcut.href.replace(/\//g, '')}`}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <div className={`p-1.5 rounded-lg ${shortcut.color} bg-opacity-10`}>
                    <shortcut.icon className={`h-4 w-4 ${shortcut.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="text-xs font-medium leading-tight">
                    {shortcut.name}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
