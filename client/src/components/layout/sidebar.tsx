import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubscriptionFeatures } from "@/lib/subscription-check";
import { RateHonkLogoSmall } from "@/components/ui/ratehonk-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Users,
  MessageSquare,
  CheckSquare,
  Filter,
  RefreshCw,
  Share2,
  Calendar,
  Package,
  FileText,
  Mail,
  Zap,
  Target,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Crown,
  Palette,
  Eye,
  EyeOff,
  Layout,
  Users as UsersIcon,
  GripVertical,
  TestTube,
  TrendingUp,
  Bot,
  Sparkles,
  Kanban,
  LogOut,
  User,
  Building2,
  CreditCard,
  Globe,
  Receipt,
} from "lucide-react";
// import Logo from "../../assets/Logo-sidebar.svg";
import Logo from "../../assets/RATEHONKLOGO.png";

// Enhanced group icon mapping for better visual hierarchy
const groupIcons = {
  "Customer Management": Users,
  "Lead Management": Target,
  "Booking & Sales": Calendar,
  "Email Marketing": Mail,
  Automation: Bot,
  Reports: BarChart3,
  "User Management": UsersIcon,
  Settings: Settings,
  "Help & Support": HelpCircle,
  "Hotel Management": Building2,
};

// Sortable Menu Item Component with enhanced styling
interface SortableMenuItemProps {
  item: any;
  isActive: boolean;
  isEditMode: boolean;
}

function SortableMenuItem({
  item,
  isActive,
  isEditMode,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditMode) {
    return (
      <SidebarMenuItem ref={setNodeRef} style={style}>
        <div className="flex items-center gap-3 w-full p-3 mb-1 hover:bg-sidebar-accent/50 rounded-xl transition-all duration-200 border-2 border-dashed border-sidebar-border">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-sidebar-accent rounded-md"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </div>
          <div className="p-2 rounded-lg bg-sidebar-accent/30">
            <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
          </div>
          <span className="truncate font-medium text-sidebar-foreground">
            {item.name}
          </span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "mb-1 h-11 rounded-xl transition-all duration-200 group relative overflow-hidden",
          isActive ? "shadow-lg shadow-blue-500/20" : "hover:bg-white/10"
        )}
        style={{
          backgroundColor: isActive
            ? "hsl(var(--sidebar-primary) / 0.2)"
            : "transparent",
          color: "hsl(var(--sidebar-foreground))",
        }}
      >
        <Link
          href={item.href}
          className="flex items-center gap-3 w-full px-3 py-2"
        >
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              isActive
                ? "bg-white/20"
                : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
          </div>
          <span
            className="truncate font-medium"
            style={{ color: "hsl(var(--sidebar-foreground))" }}
          >
            {item.name}
          </span>
          {item.badge && (
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="ml-auto text-xs"
            >
              {item.badge}
            </Badge>
          )}
          {isActive && (
            <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Enhanced Sortable Group Component with better visual design
interface SortableGroupProps {
  groupName: string;
  items: any[];
  isOpen: boolean;
  onToggle: () => void;
  isActive: boolean;
  location: string;
  isEditMode: boolean;
}

function SortableGroup({
  groupName,
  items,
  isOpen,
  onToggle,
  isActive,
  location,
  isEditMode,
}: SortableGroupProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { state } = useSidebar();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [sortedItems, setSortedItems] = useState(() => items);

  useEffect(() => {
    setSortedItems(items);
  }, [items.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save the new order to backend
        newItems.forEach((item, index) => {
          updateMenuOrder(item.id, index + 1);
        });

        return newItems;
      });
    }
  };

  const updateMenuOrder = async (itemId: string, newOrder: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`/api/menu/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuItemId: itemId,
          customOrder: newOrder,
        }),
      });
    } catch (error) {
      console.error("Failed to update menu order:", error);
    }
  };

  // Find the group icon
  const GroupIcon = groupIcons[groupName as keyof typeof groupIcons] || Target;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isSubmenuHovered) {
        setIsHovered(false);
      }
    }, 100);
  };

  const handleSubmenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsSubmenuHovered(true);
    setIsHovered(true);
  };

  const handleSubmenuMouseLeave = () => {
    setIsSubmenuHovered(false);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SidebarMenuItem
      className="relative"
      data-menu-group={groupName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={menuRef}>
        <SidebarMenuButton
          onClick={onToggle}
          isActive={isActive}
          className={cn(
            "w-full justify-between mb-1 h-11 rounded-xl transition-all duration-200 group",
            isActive
              ? "bg-primary/10 text-primary border border-primary/20"
              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/20"
                  : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent/50"
              )}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
            </div>
            <span className="font-medium">{groupName}</span>
          </div>
          <div className="flex items-center gap-2">
            {items.some((item) => item.badge) && (
              <div className="h-2 w-2 bg-primary rounded-full" />
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform" />
            )}
          </div>
        </SidebarMenuButton>

        {/* Enhanced Hover submenu for collapsed sidebar */}
        {(isHovered || isSubmenuHovered) &&
          !isOpen &&
          !isEditMode &&
          state === "collapsed" &&
          sortedItems.length > 0 && (
            <div
              className="fixed z-[99999] min-w-[240px] max-w-[320px] bg-popover border border-border rounded-xl shadow-2xl p-2 backdrop-blur-sm animate-in slide-in-from-left-2 duration-200"
              style={{
                left: "72px",
                top: Math.max(
                  10,
                  menuRef.current
                    ? menuRef.current.getBoundingClientRect().top
                    : 0
                ),
              }}
              onMouseEnter={handleSubmenuMouseEnter}
              onMouseLeave={handleSubmenuMouseLeave}
            >
              <div className="p-2 border-b border-border mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <GroupIcon className="h-4 w-4" />
                  {groupName}
                </div>
              </div>
              <div className="space-y-1">
                {sortedItems.map((item: any) => (
                  <Link key={item.id} href={item.href}>
                    <div className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-lg transition-all duration-200 cursor-pointer group">
                      <div className="p-1.5 rounded-md bg-accent/50 group-hover:bg-accent">
                        <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Original expanded submenu with enhanced styling */}
        {isOpen && (
          <SidebarMenuSub className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border/50 pl-4">
            {isEditMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedItems.map((item: any) => (
                    <SortableMenuSubItem
                      key={item.id}
                      item={item}
                      location={location}
                      isEditMode={isEditMode}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              sortedItems.map((item: any) => (
                <SidebarMenuSubItem key={item.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={location === item.href}
                    className={cn(
                      "h-10 rounded-lg transition-all duration-200 group relative",
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    )}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 w-full p-2"
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          location === item.href
                            ? "bg-white/20"
                            : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                      </div>
                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge
                          variant={
                            location === item.href ? "secondary" : "outline"
                          }
                          className="ml-auto text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {location === item.href && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full" />
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))
            )}
          </SidebarMenuSub>
        )}
      </div>
    </SidebarMenuItem>
  );
}

// Enhanced Sortable Sub Menu Item Component
interface SortableMenuSubItemProps {
  item: any;
  location: string;
  isEditMode: boolean;
}

function SortableMenuSubItem({
  item,
  location,
  isEditMode,
}: SortableMenuSubItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditMode) {
    return (
      <SidebarMenuSubItem ref={setNodeRef} style={style}>
        <div className="flex items-center gap-3 w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200 border-2 border-dashed border-sidebar-border">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-sidebar-accent rounded-md"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </div>
          <div className="p-1.5 rounded-md bg-sidebar-accent/30">
            <item.icon className="h-3.5 w-3.5 shrink-0" />
          </div>
          <span className="truncate text-sm font-medium">{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={location === item.href}
        className={cn(
          "h-9 rounded-lg transition-all duration-200 group relative",
          location === item.href
            ? "bg-[hsl(var(--sidebar-primary))] text-white shadow-sm"
            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
        )}
      >
        <Link href={item.href} className="flex items-center gap-3 w-full p-2">
          <div
            className={cn(
              "p-1.5 rounded-md transition-colors",
              location === item.href
                ? "bg-white/20"
                : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
          </div>
          <span
            className="truncate text-sm font-medium"
            style={{
              color:
                location === item.href
                  ? "white"
                  : "hsl(var(--sidebar-foreground))",
              fontWeight: location === item.href ? "600" : "500",
            }}
          >
            {item.name}
          </span>
          {item.badge && (
            <Badge
              variant={location === item.href ? "secondary" : "outline"}
              className="ml-auto text-xs"
            >
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// Enhanced User Profile Component
function UserProfile() {
  const { user, tenant, logout } = useAuth();
  const { state: sidebarState } = useSidebar();

  // Safely access user properties with fallbacks
  const userName = (user as any)?.name || (user as any)?.displayName || "User";
  const userEmail = (user as any)?.email || "user@example.com";
  const userProfileImage =
    (user as any)?.profileImage ||
    (user as any)?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;
  const tenantName = (tenant as any)?.name || "My Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 justify-start hover:bg-sidebar-accent rounded-xl transition-all duration-200"
          style={{ backgroundColor: "transparent" }}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-9 w-9 border-2 border-sidebar-border/50">
              <AvatarImage src={userProfileImage} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {userName.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {sidebarState !== "collapsed" && (
              <div className="flex-1 text-left min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "hsl(var(--sidebar-foreground))" }}
                >
                  {userName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
                >
                  {userEmail}
                </p>
              </div>
            )}
            {sidebarState !== "collapsed" && (
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start"
        side={sidebarState === "collapsed" ? "right" : "bottom"}
        sideOffset={sidebarState === "collapsed" ? 16 : 8}
        data-testid="user-profile-dropdown" 
        className="w-56 rounded-xl shadow-lg bg-white border border-sidebar-border"

      >
        <DropdownMenuLabel className="font-medium">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {(tenant as any)?.name || 'My Account'}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer rounded-lg">
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-lg">
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// All available menu items with metadata (keeping your existing structure)
const allMenuItems = {
  dashboard: {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    group: null,
    badge: null,
    order: 1,
  },
    customers: {
    name: "Customer Directory",
    href: "/customers",
    icon: Users,
    group: null,
    badge: null,
    order: 2,
  },
  shortcuts: {
    name: "Quick Shortcuts",
    href: "/shortcuts",
    icon: Zap,
    group: null,
    badge: null,
    order: 2.5,
  },
  // customers: {
  //   name: "Customer Directory",
  //   href: "/customers",
  //   icon: Users,
  //   group: "Customer Management",
  //   badge: "1,234",
  //   order: 2,
  // },
  // communications: {
  //   name: "Communications Hub",
  //   href: "/communications",
  //   icon: MessageSquare,
  //   group: "Customer Management",
  //   badge: null,
  //   order: 2,
  // },
  tasks: {
    name: "Tasks & Follow-ups",
    href: "/tasks",
    icon: CheckSquare,
    group: "User Management",
    badge: null,
    order: 8.3,
  },
  leads: {
    name: "Lead Pipeline",
    href: "/leads",
    icon: Filter,
    group: "Lead Management",
    badge: "89",
    order: 3,
  },
  "lead-types": {
    name: "Lead Categories",
    href: "/lead-types",
    icon: Palette,
    group: "Lead Management",
    badge: null,
    order: 3,
  },
  "lead-sync": {
    name: "Lead Import & Sync",
    href: "/lead-sync",
    icon: RefreshCw,
    group: "Lead Management",
    badge: null,
    order: 3,
  },
  "social-integrations": {
    name: "Social Media Hub",
    href: "/social-integrations",
    icon: Share2,
    group: "Lead Management",
    badge: null,
    order: 3,
  },
  "lead-analytics": {
    name: "Lead Analytics",
    href: "/lead-analytics",
    icon: TrendingUp,
    group: "Lead Management",
    badge: "New",
    order: 3,
  },
  calendar: {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  bookings: {
    name: "Booking Management",
    href: "/bookings",
    icon: Calendar,
    group: "Booking & Sales",
    badge: "156",
    order: 4,
  },
  packages: {
    name: "Travel Packages",
    href: "/packages",
    icon: Package,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  invoices: {
    name: "Invoices & Billing",
    href: "/invoices",
    icon: FileText,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  estimates: {
    name: "Estimate Management",
    href: "/estimates",
    icon: FileText,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  vendors: {
    name: "Vendor Management",
    href: "/vendors",
    icon: Building2,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  expenses: {
    name: "Expense Management",
    href: "/expenses",
    icon: CreditCard,
    group: "Booking & Sales",
    badge: null,
    order: 4,
  },
  "booking-recommendations": {
    name: "AI Recommendations",
    href: "/booking-recommendations",
    icon: Sparkles,
    group: "Booking & Sales",
    badge: "AI",
    order: 4,
  },
  // flights: {
  //   name: "Flights",
  //   href: "/flights",
  //   icon: Package,
  //   group: "Booking & Sales",
  //   badge: null,
  //   order: 4,
  // },
  // "flight-detail": {
  //   name: "Flight Detail",
  //   href: "/flight-detail",
  //   icon: Package,
  //   group: "Booking & Sales",
  //   badge: null,
  //   order: 4,
  // },
  "email-campaigns": {
    name: "Campaign Manager",
    href: "/email-campaigns",
    icon: Mail,
    group: "Email Marketing",
    badge: null,
    order: 5,
  },
  "email-automations": {
    name: "Email Workflows",
    href: "/email-automations",
    icon: Zap,
    group: "Email Marketing",
    badge: "New",
    order: 5,
  },
  "email-ab-tests": {
    name: "A/B Testing",
    href: "/email-ab-tests",
    icon: Target,
    group: "Email Marketing",
    badge: "Pro",
    order: 5,
  },
  "email-segments": {
    name: "Audience Segments",
    href: "/email-segments",
    icon: UsersIcon,
    group: "Email Marketing",
    badge: null,
    order: 5,
  },
  "email-settings": {
    name: "Email Setting",
    href: "/email-settings",
    icon: Mail,
    group: "Settings",
    badge: null,
    order: 9.3,
  },
  "email-test": {
    name: "Email Testing",
    href: "/email-test",
    icon: TestTube,
    group: "Email Marketing",
    badge: "New",
    order: 5,
  },
  "gmail-emails": {
    name: "Gmail Integration",
    href: "/gmail-emails",
    icon: Mail,
    group: "Email Marketing",
    badge: "New",
    order: 5,
  },
  hotels: {
    name: "Hotels Overview",
    href: "/hotels",
    icon: Building2,
    group: "Hotel Management",
    badge: null,
    order: 4.5,
  },
  "hotels-list": {
    name: "Flights",
    href: "/flights",
    icon: Building2,
    group: "Hotel Management",
    badge: null,
    order: 4.5,
  },
  "automation-workflows": {
    name: "Workflow Automation",
    href: "/automation-workflows",
    icon: Bot,
    group: "Automation",
    badge: "Pro",
    order: 6,
  },
  reports: {
    name: "Analytics & Reports",
    href: "/reports",
    icon: BarChart3,
    group: "Reports",
    badge: null,
    order: 7,
  },
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
  "dynamic-fields": {
    name: "Dynamic Fields",
    href: "/dynamic-fields",
    icon: Settings,
    group: "Settings",
    badge: "New",
    order: 9,
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
    group: "Help & Support",
    badge: null,
    order: 10,
  },
};

// Menu customization dialog component (keeping your existing structure)
function MenuCustomizationDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`],
    enabled: !!tenant?.id && isOpen,
  });

  // Initialize menu items with proper ordering
  useEffect(() => {
    if ((preferences as any[]).length > 0) {
      const items = Object.entries(allMenuItems)
        .map(([itemId, item]) => {
          const preference = (preferences as any[]).find(
            (p: any) => p.menuItemId === itemId
          );
          return {
            id: itemId,
            ...item,
            name: preference?.customName || item.name,
            order: preference?.customOrder || item.order || 0,
          };
        })
        .sort((a, b) => a.order - b.order);

      setMenuItems(items);
    } else {
      // Initialize with default order
      const items = Object.entries(allMenuItems)
        .map(([itemId, item]) => ({
          id: itemId,
          ...item,
          order: item.order ?? 0,
        }))
        .sort((a, b) => a.order - b.order);

      setMenuItems(items);
    }
  }, [preferences]);


  const updatePreferenceMutation = useMutation({
    mutationFn: ({ menuItemId, data }: { menuItemId: string; data: any }) =>
      fetch(`/api/tenants/${tenant?.id}/menu-preferences/${menuItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`],
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = menuItems.findIndex((item) => item.id === active.id);
    const newIndex = menuItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(menuItems, oldIndex, newIndex);
    setMenuItems(newItems);

    // Update the order in the database
    newItems.forEach((item, index) => {
      updatePreferenceMutation.mutate({
        menuItemId: item.id,
        data: { customOrder: index },
      });
    });
  };

  const toggleItemVisibility = (
    menuItemId: string,
    currentVisibility: boolean
  ) => {
    updatePreferenceMutation.mutate({
      menuItemId,
      data: { isVisible: !currentVisibility },
    });
  };

  const updateCustomName = (menuItemId: string, customName: string) => {
    updatePreferenceMutation.mutate({
      menuItemId,
      data: { customName },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layout className="h-5 w-5 text-primary" />
            </div>
            Customize Menu Layout
          </DialogTitle>
          <DialogDescription>
            Reorder menu items, toggle visibility, and customize names to match
            your workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Loading menu preferences...
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={menuItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {menuItems.map((item) => {
                    const preference = (preferences as any[]).find(
                      (p: any) => p.menuItemId === item.id
                    );

                    return (
                      <SortableMenuCustomizationItem
                        key={item.id}
                        item={item}
                        preference={preference}
                        onToggleVisibility={toggleItemVisibility}
                        onUpdateCustomName={updateCustomName}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag the handle to reorder items
          </div>
          <Button onClick={onClose} className="rounded-lg">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sortable menu item component for drag and drop in customization dialog
function SortableMenuCustomizationItem({
  item,
  preference,
  onToggleVisibility,
  onUpdateCustomName,
}: {
  item: any;
  preference: any;
  onToggleVisibility: (id: string, current: boolean) => void;
  onUpdateCustomName: (id: string, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = preference?.isVisible ?? true;
  const customName = preference?.customName || "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-4 border-2 rounded-xl hover:bg-accent/50 transition-all duration-200",
        isDragging && "shadow-lg border-primary bg-accent",
        !isVisible && "opacity-60"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
        <div className="p-2 rounded-lg bg-accent/50">
          <item.icon className="h-5 w-5 text-foreground/70" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-foreground">
            {customName || item.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.group || "Main Menu"} • {item.href}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`name-${item.id}`}
            className="text-sm whitespace-nowrap"
          >
            Custom Name:
          </Label>
          <Input
            id={`name-${item.id}`}
            placeholder={item.name}
            value={customName}
            onChange={(e) => onUpdateCustomName(item.id, e.target.value)}
            className="w-40 h-9 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label
            htmlFor={`toggle-${item.id}`}
            className="text-sm flex items-center gap-2"
          >
            {isVisible ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            Visible
          </Label>
          <Switch
            id={`toggle-${item.id}`}
            checked={isVisible}
            onCheckedChange={() => onToggleVisibility(item.id, isVisible)}
          />
        </div>
      </div>
    </div>
  );
}

// Enhanced App sidebar for tenant users
interface AppSidebarProps {
  showReorderDialog?: boolean;
  setShowReorderDialog?: (show: boolean) => void;
}

export function AppSidebar({
  showReorderDialog = false,
  setShowReorderDialog,
}: AppSidebarProps = {}) {
  const [location] = useLocation();
  const { user, tenant } = useAuth();
  const { state: sidebarState } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch menu preferences from database
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`],
    enabled: !!tenant?.id,
  });

  // Fetch tenant settings to get company logo
  // Only fetch if we have a tenant and user is not SaaS owner
  const isSaasAdmin = user?.role === "saas_owner" || 
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/saas/'));
  
  const { data: tenantSettings } = useQuery({
    queryKey: ["/api/tenant/settings"],
    enabled: !!tenant && !isSaasAdmin,
  });

  // Check subscription features (only for tenant users, not SaaS owners)
  // Skip subscription check if user is SaaS owner or we're in SaaS admin area
  const subscriptionCheck = useSubscriptionFeatures();
  const hasSubscriptionAccess = isSaasAdmin
    ? () => true // SaaS owners have access to everything
    : subscriptionCheck.hasAccess;
  const subscriptionLoading = isSaasAdmin
    ? false 
    : subscriptionCheck.isLoading;

  // Build dynamic menu structure based on preferences and subscription
  const visibleMenuItems = useMemo(() => {
    const items = Object.entries(allMenuItems)
      .filter(([itemId]) => {
        // First check subscription access
        if (!subscriptionLoading && !hasSubscriptionAccess(itemId)) {
          return false; // Hide if subscription doesn't allow
        }
        // Then check tenant preferences
        const preference = (preferences as any[]).find(
          (p: any) => p.menuItemId === itemId
        );
        return preference?.isVisible !== false; // Show by default if no preference found
      })
      .map(([itemId, item]) => {
        const preference = (preferences as any[]).find(
          (p: any) => p.menuItemId === itemId
        );
        return {
          id: itemId,
          ...item,
          name: preference?.customName || item.name, // Use custom name if available
          order: preference?.customOrder || item.order || 0,
        };
      })
      .sort((a, b) => a.order - b.order);

    return items;
  }, [preferences, hasSubscriptionAccess, subscriptionLoading]);

  // Group items by their group name and sort by order
  const groupedItems = useMemo(() => {
    const grouped = visibleMenuItems.reduce((acc: any, item) => {
      const groupName = item.group || "main";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    }, {});

    return grouped;
  }, [visibleMenuItems]);

  // Define the group order
  const groupOrder = [
    "main",
    "Customer Management",
    "Lead Management",
    "Booking & Sales",
    "Hotel Management",
    "Email Marketing",
    "Automation",
    "Reports",
    "User Management",
    "Settings",
    "Help & Support",
  ];

  // Auto-expand groups that contain the current page
  const shouldGroupBeOpen = useCallback(
    (groupName: string, items: any[]) => {
      if (groupName === "main") return false;
      const hasActivePage = items.some((item: any) => location === item.href);
      return hasActivePage || openGroups[groupName];
    },
    [location, openGroups]
  );

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isActiveGroup = (groupName: string, items: any[]) => {
    return items.some((item: any) => location === item.href);
  };

  if (isLoading) {
    return (
      <SidebarPrimitive className="border-r border-sidebar-border">
        <SidebarHeader className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SidebarHeader>
      </SidebarPrimitive>
    );
  }

  return (
    <SidebarPrimitive
      className="border-r border-sidebar-border"
      style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
    >
      <SidebarHeader
        className="p-6 border-b border-sidebar-border"
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Enhanced Company Logo/Branding */}
        <div className="text-center py-4">
          {(tenantSettings as any)?.companyLogo ||
          (tenantSettings as any)?.logo ? (
            <img
              src={
                (tenantSettings as any)?.companyLogo ||
                (tenantSettings as any)?.logo
              }
              alt="Company Logo"
              className={cn(
                "object-contain mx-auto",
                sidebarState === "collapsed"
                  ? "h-8 w-8"
                  : "h-16 w-auto max-w-48"
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className={
                  sidebarState === "collapsed" ? "scale-75" : "scale-125"
                }
              >
                {/* <RateHonkLogoSmall className="no-underline" /> */}
                {/* <img
                  src={Logo}
                  alt="Logo"
                  className="w-[133px] h-[31px] object-contain"
                /> */}
                  <img src={Logo} alt="Logo" className="w-[140px] h-[40px] object-contain center mx-auto rounded-md bg-white p-1"/>
              </div>
              {sidebarState !== "collapsed" && (
                <span className="text-xs text-sidebar-foreground/70 font-medium">
                  RateHonk CRM
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Header Actions - Hide when collapsed */}
        {sidebarState !== "collapsed" && (
          <div className="flex items-center gap-2 mt-4">
            <SidebarTrigger
              className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent border-sidebar-border"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizationDialog(true)}
              className="ml-auto rounded-lg text-xs text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent"
              style={{
                color: "hsl(var(--sidebar-foreground))",
                borderColor: "hsl(var(--sidebar-border))",
              }}
            >
              <Layout className="h-3 w-3 mr-1" />
              Customize
            </Button>
          </div>
        )}

        {/* Collapsed state - Show only trigger */}
        {sidebarState === "collapsed" && (
          <div className="flex justify-center mt-2">
            <SidebarTrigger
              className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent border-sidebar-border"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent
        className="p-3"
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {/* Enhanced Main menu items */}
            {groupedItems.main?.map((item: any) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.href}
                  className={cn(
                    "mb-1 h-12 transition-all duration-200 group relative overflow-hidden text-[#364152]",
                    location === item.href
                      ? "border-l-4 border-[hsl(var(--sidebar-primary))]"
                      : "hover:bg-sidebar-accent/50"
                  )}
                  style={{
                    backgroundColor:
                      location === item.href
                        ? "hsl(var(--sidebar-primary) / 0.2)"
                        : "transparent",
                  }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 w-full px-3 py-2"
                    id={`nav-${item.href.replace("/", "")}`}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        location === item.href
                          ? ""
                          : "bg-sidebar-accent/30 group-hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                    </div>
                    {sidebarState !== "collapsed" && (
                      <span
                        className="truncate font-medium text-sm"
                        style={{
                          color:
                            location === item.href
                              ? "hsl(var(--sidebar-primary-foreground))"
                              : "hsl(var(--sidebar-foreground))",
                          fontWeight: location === item.href ? "600" : "500",
                        }}
                      >
                        {item.name}
                      </span>
                    )}
                    {item.badge && sidebarState !== "collapsed" && (
                      <Badge
                        variant={
                          location === item.href ? "secondary" : "outline"
                        }
                        className="ml-auto text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Enhanced Grouped menu items with improved visual hierarchy */}
            {groupOrder.map((groupName) => {
              const items = groupedItems[groupName];
              if (!items || items.length === 0 || groupName === "main")
                return null;

              const isOpen = shouldGroupBeOpen(groupName, items);
              const isActive = isActiveGroup(groupName, items);

              return (
                <div key={groupName} className="mb-3">
                  <SortableGroup
                    groupName={groupName}
                    items={items}
                    isOpen={isOpen}
                    onToggle={() => toggleGroup(groupName)}
                    isActive={isActive}
                    location={location}
                    isEditMode={isEditMode}
                  />
                </div>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className="p-4 border-t border-sidebar-border"
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Enhanced User Profile Section */}
        <UserProfile />
      </SidebarFooter>

      <SidebarRail />

      {/* Menu Customization Dialog */}
      <MenuCustomizationDialog
        isOpen={showCustomizationDialog || showReorderDialog}
        onClose={() => {
          setShowCustomizationDialog(false);
          setShowReorderDialog?.(false);
        }}
      />
    </SidebarPrimitive>
  );
}

// Simple Sidebar wrapper for backwards compatibility
export function Sidebar(props: AppSidebarProps) {
  return <AppSidebar {...props} />;
}
