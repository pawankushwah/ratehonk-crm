import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Layout } from "@/components/layout/layout";
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
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Crown,
  Eye,
  EyeOff,
  GripVertical,
  TestTube,
  TrendingUp,
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Menu,
  Check,
  X,
  AlertCircle,
  Move,
  Palette,
} from "lucide-react";

// All available menu items with metadata
const allMenuItems = {
  'dashboard': { name: "Dashboard", href: "/dashboard", icon: BarChart3, group: null, badge: null, order: 1 },
  'customers': { name: "Customers", href: "/customers", icon: Users, group: "Customer Management", badge: "1,234", order: 2 },
  'communications': { name: "Communications", href: "/communications", icon: MessageSquare, group: "Customer Management", badge: null, order: 2 },
  'tasks': { name: "Tasks & Follow-ups", href: "/tasks", icon: CheckSquare, group: "Customer Management", badge: null, order: 2 },
  'leads': { name: "Leads", href: "/leads", icon: Filter, group: "Lead Management", badge: "89", order: 3 },
  'lead-types': { name: "Lead Categories", href: "/lead-types", icon: Palette, group: "Lead Management", badge: null, order: 3 },
  'lead-sync': { name: "Lead Sync", href: "/lead-sync", icon: RefreshCw, group: "Lead Management", badge: null, order: 3 },
  'social-integrations': { name: "Social Media", href: "/social-integrations", icon: Share2, group: "Lead Management", badge: null, order: 3 },
  'lead-analytics': { name: "Lead Analytics", href: "/lead-analytics", icon: TrendingUp, group: "Lead Management", badge: "New", order: 3 },
  'calendar': { name: "Calendar", href: "/calendar", icon: Calendar, group: "Booking & Sales", badge: null, order: 4 },
  'bookings': { name: "Bookings", href: "/bookings", icon: Calendar, group: "Booking & Sales", badge: "156", order: 4 },
  'packages': { name: "Travel Packages", href: "/packages", icon: Package, group: "Booking & Sales", badge: null, order: 4 },
  'invoices': { name: "Invoices", href: "/invoices", icon: FileText, group: "Booking & Sales", badge: null, order: 4 },
  'booking-recommendations': { name: "AI Recommendations", href: "/booking-recommendations", icon: Sparkles, group: "Booking & Sales", badge: "AI", order: 4 },
  'email-campaigns': { name: "Email Campaigns", href: "/email-campaigns", icon: Mail, group: "Email Marketing", badge: null, order: 5 },
  'email-automations': { name: "Email Automations", href: "/email-automations", icon: Zap, group: "Email Marketing", badge: "New", order: 5 },
  'email-ab-tests': { name: "A/B Testing", href: "/email-ab-tests", icon: Target, group: "Email Marketing", badge: "Pro", order: 5 },
  'email-segments': { name: "Email Segments", href: "/email-segments", icon: Users, group: "Email Marketing", badge: null, order: 5 },
  'email-settings': { name: "Email Settings", href: "/email-settings", icon: Settings, group: "Email Marketing", badge: null, order: 5 },
  'email-test': { name: "Email Test", href: "/email-test", icon: TestTube, group: "Email Marketing", badge: "New", order: 5 },
  'gmail-emails': { name: "Gmail Emails", href: "/gmail-emails", icon: Mail, group: "Email Marketing", badge: "New", order: 5 },
  'automation-workflows': { name: "Automation Workflows", href: "/automation-workflows", icon: Bot, group: "Automation", badge: "Pro", order: 6 },
  'reports': { name: "Reports", href: "/reports", icon: BarChart3, group: "Reports", badge: null, order: 7 },
  'roles': { name: "Role Management", href: "/roles", icon: Crown, group: "User Management", badge: "New", order: 8 },
  'users': { name: "User Management", href: "/users", icon: Users, group: "User Management", badge: null, order: 8 },
  'dynamic-fields': { name: "Dynamic Fields", href: "/dynamic-fields", icon: Settings, group: "Settings", badge: "New", order: 9 },
  'menu-ordering': { name: "Menu Ordering", href: "/menu-ordering", icon: Menu, group: "Settings", badge: null, order: 9 },
  'settings': { name: "Settings", href: "/settings", icon: Settings, group: "Settings", badge: null, order: 9 },
  'subscription': { name: "Subscription", href: "/subscription", icon: Crown, group: "Settings", badge: null, order: 9 },
  'support': { name: "Help & Support", href: "/support", icon: HelpCircle, group: "Help & Support", badge: null, order: 10 }
};

// Define group order and metadata
const menuGroups = {
  'main': { name: 'Main Menu Items', order: 1, icon: BarChart3 },
  'Customer Management': { name: 'Customer Management', order: 2, icon: Users },
  'Lead Management': { name: 'Lead Management', order: 3, icon: Filter },
  'Booking & Sales': { name: 'Booking & Sales', order: 4, icon: Calendar },
  'Email Marketing': { name: 'Email Marketing', order: 5, icon: Mail },
  'Automation': { name: 'Automation', order: 6, icon: Bot },
  'Reports': { name: 'Reports', order: 7, icon: BarChart3 },
  'User Management': { name: 'User Management', order: 8, icon: Crown },
  'Settings': { name: 'Settings', order: 9, icon: Settings },
  'Help & Support': { name: 'Help & Support', order: 10, icon: HelpCircle }
};

// Sortable Menu Item Component
interface SortableMenuItemProps {
  item: any;
  onToggleVisibility: (itemId: string, isVisible: boolean) => void;
  onUpdateName: (itemId: string, name: string) => void;
  preference: any;
}

function SortableMenuItem({ item, onToggleVisibility, onUpdateName, preference }: SortableMenuItemProps) {
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

  const isVisible = preference?.isVisible !== false;
  const customName = preference?.customName || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center justify-between p-4 border rounded-lg transition-all duration-200
        ${isDragging 
          ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 shadow-lg rotate-2 scale-105' 
          : isVisible 
            ? 'hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900' 
            : 'bg-gray-100 dark:bg-gray-800 opacity-60 border-dashed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className={`
            cursor-grab active:cursor-grabbing p-2 rounded-md transition-colors
            ${isDragging 
              ? 'bg-blue-100 dark:bg-blue-900' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <GripVertical className={`h-4 w-4 ${isDragging ? 'text-blue-600' : 'text-muted-foreground'}`} />
        </div>
        
        <div className={`p-2 rounded-md ${isVisible ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
          <item.icon className={`h-5 w-5 ${isVisible ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
        </div>
        
        <div className="flex-1">
          <div className={`font-medium ${!isVisible ? 'text-gray-500 line-through' : ''}`}>
            {customName || item.name}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            {item.group || 'Main Menu'}
            {!isVisible && (
              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                Hidden
              </Badge>
            )}
          </div>
          {item.badge && isVisible && (
            <Badge variant="secondary" className="text-xs mt-1">
              {item.badge}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Custom name"
            value={customName}
            onChange={(e) => onUpdateName(item.id, e.target.value)}
            className="w-40 h-9 text-sm"
            disabled={isDragging}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Label htmlFor={`toggle-${item.id}`} className="text-sm flex items-center gap-1">
            {isVisible ? 
              <Eye className="h-4 w-4 text-green-600" /> : 
              <EyeOff className="h-4 w-4 text-gray-400" />
            }
            <span className="hidden sm:inline">{isVisible ? 'Visible' : 'Hidden'}</span>
          </Label>
          <Switch
            id={`toggle-${item.id}`}
            checked={isVisible}
            onCheckedChange={(checked) => onToggleVisibility(item.id, checked)}
            disabled={isDragging}
          />
        </div>
      </div>
    </div>
  );
}

// Sortable Group Component
interface SortableGroupProps {
  groupData: {
    name: string;
    items: any[];
    groupKey: string;
  };
  preferences: any[];
  onReorder: (groupName: string, items: any[]) => void;
  onToggleVisibility: (itemId: string, isVisible: boolean) => void;
  onUpdateName: (itemId: string, name: string) => void;
}

function SortableGroup({ groupData, preferences, onReorder, onToggleVisibility, onUpdateName }: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupData.groupKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GroupSection
        groupName={groupData.name}
        groupKey={groupData.groupKey}
        items={groupData.items}
        preferences={preferences}
        onReorder={onReorder}
        onToggleVisibility={onToggleVisibility}
        onUpdateName={onUpdateName}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Group Section Component
interface GroupSectionProps {
  groupName: string;
  groupKey: string;
  items: any[];
  preferences: any[];
  onReorder: (groupName: string, items: any[]) => void;
  onToggleVisibility: (itemId: string, isVisible: boolean) => void;
  onUpdateName: (itemId: string, name: string) => void;
  dragHandleProps?: any;
}

function GroupSection({ groupName, groupKey, items, preferences, onReorder, onToggleVisibility, onUpdateName, dragHandleProps }: GroupSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [sortedItems, setSortedItems] = useState(items);

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const handleDragStart = () => {
    // Visual feedback when dragging starts
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        onReorder(groupName, newItems);
        return newItems;
      });
    }
  };

  const groupIcon = menuGroups[groupKey as keyof typeof menuGroups]?.icon || Menu;
  const IconComponent = groupIcon;

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <IconComponent className="h-5 w-5" />
          {groupName === 'main' ? 'Main Menu Items' : groupName}
          <Badge variant="outline" className="text-xs">
            {items.length} items
          </Badge>
        </CardTitle>
        <CardDescription>
          {dragHandleProps ? 
            "Drag group handle to reorder sections, or drag items within groups" :
            "Drag and drop to reorder items, toggle visibility, and customize names"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sortedItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedItems.map((item: any) => {
                const preference = preferences.find((p: any) => p.menuItemId === item.id);
                return (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    preference={preference}
                    onToggleVisibility={onToggleVisibility}
                    onUpdateName={onUpdateName}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

export default function MenuOrdering() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    type: 'reorder' | 'visibility' | 'reset' | 'group-reorder';
    data: any;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Fetch menu preferences
  const { data: preferences = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`],
    enabled: !!tenant?.id
  });

  // Fetch group order preferences
  const { data: groupPreferences = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/group-preferences`],
    enabled: !!tenant?.id
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: ({ menuItemId, data }: { menuItemId: string; data: any }) =>
      fetch(`/api/tenants/${tenant?.id}/menu-preferences/${menuItemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`] });
    }
  });

  // Reorder menu mutation
  const reorderMutation = useMutation({
    mutationFn: ({ menuItemId, customOrder }: { menuItemId: string; customOrder: number }) =>
      fetch(`/api/menu/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          menuItemId,
          customOrder
        })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/menu-preferences`] });
      toast({
        title: "Menu order updated",
        description: "Your menu has been reordered successfully.",
      });
    }
  });

  // Build menu structure with preferences - memoized to prevent re-renders
  const menuItemsWithPreferences = useMemo(() => {
    return Object.entries(allMenuItems).map(([itemId, item]) => {
      const preference = preferences.find((p: any) => p.menuItemId === itemId);
      return {
        id: itemId,
        ...item,
        order: preference?.customOrder || 0
      };
    }).sort((a, b) => a.order - b.order);
  }, [preferences]);

  // Group items by their group name - memoized to prevent re-renders
  const groupedItems = useMemo(() => {
    return menuItemsWithPreferences.reduce((acc: any, item) => {
      const groupName = item.group || 'main';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    }, {});
  }, [menuItemsWithPreferences]);

  // Initialize group order when preferences load - using useMemo to prevent infinite re-renders
  const memoizedGroupOrder = useMemo(() => {
    if (groupPreferences && groupPreferences.length > 0) {
      return groupPreferences
        .sort((a: any, b: any) => a.customOrder - b.customOrder)
        .map((g: any) => g.groupKey);
    } else if (Object.keys(groupedItems).length > 0) {
      // Default order based on menuGroups
      return Object.keys(groupedItems).sort((a, b) => {
        const orderA = menuGroups[a as keyof typeof menuGroups]?.order || 999;
        const orderB = menuGroups[b as keyof typeof menuGroups]?.order || 999;
        return orderA - orderB;
      });
    }
    return [];
  }, [groupPreferences]);

  // Update group order only when memoized value changes
  useEffect(() => {
    if (memoizedGroupOrder.length > 0 && JSON.stringify(groupOrder) !== JSON.stringify(memoizedGroupOrder)) {
      setGroupOrder(memoizedGroupOrder);
    }
  }, [memoizedGroupOrder, groupOrder]);

  // Create ordered group data for drag and drop - memoized
  const orderedGroupData = useMemo(() => {
    return groupOrder.map(groupKey => ({
      groupKey,
      name: groupKey === 'main' ? 'Main Menu Items' : groupKey,
      items: groupedItems[groupKey] || []
    }));
  }, [groupOrder, groupedItems]);

  // Sensors for group-level drag and drop
  const groupSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleVisibility = useCallback((menuItemId: string, isVisible: boolean) => {
    const menuItem = allMenuItems[menuItemId as keyof typeof allMenuItems];
    setPendingAction({
      type: 'visibility',
      data: { menuItemId, isVisible, itemName: menuItem?.name || menuItemId }
    });
  }, []);

  const handleUpdateName = useCallback((menuItemId: string, customName: string) => {
    // Debounced name update - save automatically after typing stops
    updatePreferenceMutation.mutate({
      menuItemId,
      data: { customName }
    });
    
    if (customName.trim() !== '') {
      toast({
        title: "Menu item renamed",
        description: `Menu item has been renamed to "${customName}".`,
      });
    }
  }, [updatePreferenceMutation, toast]);

  const handleReorder = useCallback((groupName: string, items: any[]) => {
    setPendingAction({
      type: 'reorder',
      data: { groupName, items }
    });
  }, []);

  // Group order update mutation
  const updateGroupOrderMutation = useMutation({
    mutationFn: (groupOrder: string[]) =>
      fetch(`/api/tenants/${tenant?.id}/group-preferences/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ groupOrder })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/group-preferences`] });
    }
  });

  const handleGroupReorder = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = groupOrder.findIndex((item) => item === active.id);
      const newIndex = groupOrder.findIndex((item) => item === over?.id);
      const newOrder = arrayMove(groupOrder, oldIndex, newIndex);
      
      setPendingAction({
        type: 'group-reorder',
        data: { newOrder, fromGroup: active.id, toPosition: newIndex + 1 }
      });
      
      setIsDragActive(false);
    }
  }, [groupOrder]);

  const handleResetToDefault = useCallback(() => {
    setPendingAction({
      type: 'reset',
      data: {}
    });
  }, []);

  // Execute pending actions after confirmation
  const executePendingAction = () => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case 'visibility':
        const { menuItemId, isVisible } = pendingAction.data;
        updatePreferenceMutation.mutate({
          menuItemId,
          data: { isVisible }
        });
        
        toast({
          title: isVisible ? "Menu item shown" : "Menu item hidden",
          description: `The menu item has been ${isVisible ? 'shown' : 'hidden'} in the sidebar.`,
        });
        break;

      case 'reorder':
        const { items } = pendingAction.data;
        items.forEach((item: any, index: number) => {
          const newOrder = index + 1;
          reorderMutation.mutate({
            menuItemId: item.id,
            customOrder: newOrder
          });
        });
        break;

      case 'group-reorder':
        const { newOrder } = pendingAction.data;
        setGroupOrder(newOrder);
        updateGroupOrderMutation.mutate(newOrder);
        
        toast({
          title: "Menu groups reordered",
          description: "Your menu section order has been updated successfully.",
        });
        break;

      case 'reset':
        Object.keys(allMenuItems).forEach((itemId) => {
          updatePreferenceMutation.mutate({
            menuItemId: itemId,
            data: { 
              isVisible: true, 
              customName: '', 
              customOrder: 0 
            }
          });
        });
        
        toast({
          title: "Menu reset to default",
          description: "All menu items have been reset to their default state.",
        });
        break;
    }

    setPendingAction(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading menu preferences...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Menu className="h-8 w-8 text-blue-600" />
            Menu Ordering
            {isDragActive && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 animate-pulse">
                Dragging...
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your sidebar menu by reordering items, hiding unused features, and renaming menu items.
          </p>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700">
                {(preferences as any[]).filter(p => p.isVisible !== false).length} Visible Items
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">
                {(preferences as any[]).filter(p => p.isVisible === false).length} Hidden Items
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">
                {(preferences as any[]).filter(p => p.customName && p.customName.trim() !== '').length} Custom Names
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
            disabled={updatePreferenceMutation.isPending || reorderMutation.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          
          {/* Save Status */}
          {(updatePreferenceMutation.isPending || reorderMutation.isPending) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Saving changes...</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
            How to Customize Your Menu
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-300">
            Use these controls to personalize your sidebar navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <Move className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">Reorder Sections</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Drag group handles to change section order</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-green-100">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <GripVertical className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">Reorder Items</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Drag item handles within groups to reorder</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-amber-100">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">Show/Hide</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Toggle switches to control item visibility</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-purple-100">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">Rename Items</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Type in input fields to customize names</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Groups with Drag and Drop */}
      <DndContext 
        sensors={groupSensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragActive(true)}
        onDragEnd={handleGroupReorder}
      >
        <SortableContext 
          items={groupOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className={`space-y-6 transition-all duration-200 ${isDragActive ? 'opacity-90 scale-[0.98]' : ''}`}>
            {orderedGroupData.map((groupData) => (
              <SortableGroup
                key={groupData.groupKey}
                groupData={groupData}
                preferences={preferences as any[]}
                onReorder={handleReorder}
                onToggleVisibility={handleToggleVisibility}
                onUpdateName={handleUpdateName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Confirm Menu Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {pendingAction?.type === 'visibility' && (
                <div>
                  Are you sure you want to <strong>{pendingAction.data.isVisible ? 'show' : 'hide'}</strong> the menu item "<strong>{pendingAction.data.itemName}</strong>"?
                  {!pendingAction.data.isVisible && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">This menu item will be hidden from the sidebar navigation.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {pendingAction?.type === 'reorder' && (
                <div>
                  Are you sure you want to reorder the items in the "<strong>{pendingAction.data.groupName}</strong>" group?
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Move className="h-4 w-4" />
                      <span className="text-sm">Menu items will be reordered according to your drag and drop changes.</span>
                    </div>
                  </div>
                </div>
              )}
              
              {pendingAction?.type === 'group-reorder' && (
                <div>
                  Are you sure you want to reorder the menu sections?
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Palette className="h-4 w-4" />
                      <span className="text-sm">The "<strong>{pendingAction.data.fromGroup}</strong>" section will be moved to position {pendingAction.data.toPosition}.</span>
                    </div>
                  </div>
                </div>
              )}
              
              {pendingAction?.type === 'reset' && (
                <div>
                  Are you sure you want to reset all menu customizations to their default state?
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">This action cannot be undone.</span>
                    </div>
                    <div className="mt-1 text-sm text-red-700">
                      • All custom names will be removed<br/>
                      • All hidden items will become visible<br/>
                      • All custom ordering will be reset
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executePendingAction}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4" />
              {pendingAction?.type === 'reset' ? 'Reset Menu' : 'Apply Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                All Changes Saved Automatically
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Your menu customizations are applied immediately to the sidebar navigation. 
              <br/>
              All changes require confirmation before being applied.
            </div>
            
            {/* Quick Stats Summary */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-green-200/50">
              <div className="text-center">
                <div className="text-lg font-bold text-green-800 dark:text-green-200">{Object.keys(groupedItems).length}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Menu Groups</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-800 dark:text-green-200">{Object.keys(allMenuItems).length}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-800 dark:text-green-200">
                  {(preferences as any[]).filter(p => p.customName && p.customName.trim() !== '').length}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Customized</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}