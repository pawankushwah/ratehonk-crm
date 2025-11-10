import React, { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Calendar, CalendarDays, Clock, MapPin, Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  color: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  reminders: number[];
  createdBy: string;
  timezone: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'confidential';
}

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  attendees: z.string().optional(),
  color: z.string().default("#3B82F6"),
  timezone: z.string().default("UTC"),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  visibility: z.enum(['public', 'private', 'confidential']).default('public')
});

const TIME_ZONES = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT-5)' },
  { value: 'America/Chicago', label: 'Central Time (GMT-6)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8)' },
  { value: 'Europe/London', label: 'British Time (GMT+0)' },
  { value: 'Europe/Paris', label: 'Central European Time (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (GMT+9)' },
  { value: 'Asia/Shanghai', label: 'China Time (GMT+8)' },
  { value: 'Asia/Kolkata', label: 'India Time (GMT+5:30)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (GMT+10)' },
];

const CalendarMonthView: React.FC<{ events: CalendarEvent[], currentDate: Date, onEventClick: (event: CalendarEvent) => void, onDateClick: (date: Date) => void }> = ({ 
  events, 
  currentDate, 
  onEventClick, 
  onDateClick 
}) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const days = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-500">
          {day}
        </div>
      ))}
      
      {/* Days */}
      {days.map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString();
        
        return (
          <div
            key={index}
            className={`bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 ${
              !isCurrentMonth ? 'text-gray-400' : ''
            } ${isToday ? 'bg-blue-50' : ''}`}
            onClick={() => onDateClick(day)}
          >
            <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
              {day.getDate()}
            </div>
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 text-white"
                  style={{ backgroundColor: event.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      attendees: "",
      color: "#3B82F6",
      timezone: "UTC",
      isRecurring: false,
      status: "confirmed",
      visibility: "public"
    }
  });

  // Fetch calendar events
  const { data: events = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${user?.tenantId}/calendar/events`],
    enabled: !!user?.tenantId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: z.infer<typeof eventSchema>) => {
      const processedData = {
        ...eventData,
        attendees: eventData.attendees ? eventData.attendees.split(',').map(email => email.trim()) : [],
        reminders: [15, 5] // Default reminders
      };
      
      return await apiRequest(`/api/tenants/${user?.tenantId}/calendar/events`, {
        method: 'POST',
        body: JSON.stringify(processedData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${user?.tenantId}/calendar/events`] });
      toast({
        title: "Success",
        description: "Event created successfully.",
      });
      setIsCreateEventOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updateData }: { eventId: string; updateData: Partial<CalendarEvent> }) => {
      return await apiRequest(`/api/tenants/${user?.tenantId}/calendar/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${user?.tenantId}/calendar/events`] });
      toast({
        title: "Success",
        description: "Event updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest(`/api/tenants/${user?.tenantId}/calendar/events/${eventId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${user?.tenantId}/calendar/events`] });
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });
      setIsEventDetailOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const defaultStartTime = new Date(date);
    defaultStartTime.setHours(9, 0, 0, 0);
    const defaultEndTime = new Date(date);
    defaultEndTime.setHours(10, 0, 0, 0);
    
    form.setValue('startTime', defaultStartTime.toISOString().slice(0, 16));
    form.setValue('endTime', defaultEndTime.toISOString().slice(0, 16));
    setIsCreateEventOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getViewTitle = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (currentView === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return '';
  };

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Calendar</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold">{getViewTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsCreateEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex items-center space-x-2 mb-6">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-lg shadow">
          {currentView === 'month' && (
            <CalendarMonthView
              events={events}
              currentDate={currentDate}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          )}
          {currentView === 'agenda' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {events.filter(event => new Date(event.startTime) >= new Date()).slice(0, 10).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Details Dialog */}
        <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent?.color }} />
                <span>{selectedEvent?.title}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(selectedEvent.startTime).toLocaleString()} - {new Date(selectedEvent.endTime).toLocaleString()}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.attendees.join(', ')}</span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="text-sm text-gray-600">
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedEvent.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedEvent.status}
                  </Badge>
                  <Badge variant="outline">{selectedEvent.visibility}</Badge>
                  {selectedEvent.isRecurring && (
                    <Badge variant="outline">Recurring</Badge>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEventDetailOpen(false)}>
                Close
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteEvent}
                disabled={deleteEventMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Event Dialog */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                {selectedDate && `Creating event for ${selectedDate.toLocaleDateString()}`}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  {...form.register('title')}
                  placeholder="Enter event title" 
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...form.register('description')}
                  placeholder="Enter event description" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    type="datetime-local" 
                    {...form.register('startTime')}
                  />
                  {form.formState.errors.startTime && (
                    <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime" 
                    type="datetime-local" 
                    {...form.register('endTime')}
                  />
                  {form.formState.errors.endTime && (
                    <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  {...form.register('location')}
                  placeholder="Enter location or meeting link" 
                />
              </div>
              
              <div>
                <Label htmlFor="attendees">Attendees</Label>
                <Input 
                  id="attendees" 
                  {...form.register('attendees')}
                  placeholder="Enter email addresses (comma-separated)" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Select value={form.watch('color')} onValueChange={(value) => form.setValue('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#3B82F6">Blue</SelectItem>
                      <SelectItem value="#10B981">Green</SelectItem>
                      <SelectItem value="#F59E0B">Orange</SelectItem>
                      <SelectItem value="#EF4444">Red</SelectItem>
                      <SelectItem value="#8B5CF6">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={form.watch('timezone')} onValueChange={(value) => form.setValue('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_ZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="recurring" 
                  checked={form.watch('isRecurring')}
                  onCheckedChange={(checked) => form.setValue('isRecurring', checked)}
                />
                <Label htmlFor="recurring">Recurring event</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="tentative">Tentative</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}