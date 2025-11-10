import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  Plane, 
  Phone, 
  Mail,
  MapPin,
  Clock,
  Plus
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  type: 'booking' | 'lead' | 'follow-up' | 'departure' | 'arrival';
  date: Date;
  time?: string;
  status: string;
  customer?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  destination?: string;
  amount?: number;
}

interface DashboardCalendarProps {
  className?: string;
}

export function DashboardCalendar({ className }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch calendar events using the same endpoint as main calendar
  const { data: events = [], isLoading, refetch } = useQuery<CalendarEvent[]>({
    queryKey: [`/api/debug/calendar/${tenant?.id}`, format(currentDate, 'yyyy-MM')],
    enabled: !!tenant?.id,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    queryFn: async () => {
      const token = auth.getToken();
      console.log('📅 Dashboard: Fetching events for tenant:', tenant?.id);
      
      // Use the debug endpoint that's working for the main calendar
      const response = await fetch(`/api/debug/calendar/${tenant?.id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📅 Dashboard: Successfully fetched', data?.length || 0, 'events');
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      // Transform events for dashboard display (same format as main calendar)
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type || 'event',
        date: parseISO(item.start_time || item.startTime || item.created_at),
        time: item.start_time ? format(parseISO(item.start_time), 'HH:mm') : undefined,
        status: item.status || 'confirmed',
        customer: {
          firstName: item.customerName?.split(' ')[0] || 'Event',
          lastName: item.customerName?.split(' ').slice(1).join(' ') || 'Attendee',
          email: item.customerEmail || '',
          phone: item.customerPhone || '',
        },
        description: item.description,
        priority: item.priority || 'medium',
        destination: item.destination,
        amount: item.amount || 0,
      }));
    },
  });



  // Calendar navigation
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  // Handle day click
  const handleDayClick = (day: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(day);
    setSelectedEvents(dayEvents);
    if (dayEvents.length > 0) {
      setIsEventDialogOpen(true);
    }
  };

  // Get event type color
  const getEventColor = (type: string, status: string) => {
    switch (type) {
      case 'booking':
        if (status === 'confirmed') return 'bg-green-500';
        if (status === 'pending') return 'bg-yellow-500';
        return 'bg-blue-500';
      case 'lead':
        if (status === 'hot') return 'bg-red-500';
        if (status === 'warm') return 'bg-orange-500';
        return 'bg-purple-500';
      case 'follow-up':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Plane className="h-3 w-3" />;
      case 'lead':
        return <Users className="h-3 w-3" />;
      case 'follow-up':
        return <Phone className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Bookings</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Leads</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-pink-500 rounded"></div>
              <span>Follow-ups</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-1 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                      ${isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                      ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => handleDayClick(day, dayEvents)}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'}
                      ${isCurrentDay ? 'text-blue-600 font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`
                            text-xs px-1 py-0.5 rounded text-white truncate flex items-center gap-1
                            ${getEventColor(event.type, event.status)}
                          `}
                          title={event.title}
                        >
                          {getEventIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Details Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Events for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[500px] overflow-y-auto">
              <div className="space-y-4">
                {selectedEvents.map((event, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full text-white ${getEventColor(event.type, event.status)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {event.customer && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.customer.firstName} {event.customer.lastName}
                              </div>
                            )}
                            {event.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </div>
                            )}
                            {event.destination && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.destination}
                              </div>
                            )}
                            {event.customer?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {event.customer.email}
                              </div>
                            )}
                            {event.customer?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {event.customer.phone}
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        {event.amount && (
                          <Badge variant="outline">
                            ${event.amount.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Link href={event.type === 'booking' ? `/app/tenant/bookings` : `/app/tenant/leads`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      {event.type === 'lead' && (
                        <Link href={`/app/tenant/leads`}>
                          <Button size="sm">
                            Follow Up
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}

                {selectedEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No events for this day
                    <div className="mt-4">
                      <Link href="/app/tenant/bookings">
                        <Button size="sm" className="mr-2">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Booking
                        </Button>
                      </Link>
                      <Link href="/app/tenant/leads">
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Lead
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}