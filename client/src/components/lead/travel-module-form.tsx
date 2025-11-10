import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Plane,
  Hotel,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import { cn, handleNumericKeyDown } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import type { TravelPackage } from "@/lib/types";

interface TravelModuleFormProps {
  form: UseFormReturn<any>;
  selectedCategory: string;
  typeSpecificData: any;
}

export function TravelModuleForm({
  form,
  selectedCategory,
  typeSpecificData,
}: TravelModuleFormProps) {
  const { tenant } = useAuth();
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const { data: packages = [], isLoading: packagesLoading } = useQuery<
    TravelPackage[]
  >({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch packages");
      return response.json();
    },
  });

  const flightTypeOptions = [
    { value: "one-way", label: "One Way" },
    { value: "round-trip", label: "Round Trip" },
    { value: "multi-city", label: "Multi City" },
  ];

  const flightClassOptions = [
    { value: "economy", label: "Economy" },
    { value: "premium-economy", label: "Premium Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
  ];

  const roomTypeOptions = [
    { value: "standard", label: "Standard Room" },
    { value: "deluxe", label: "Deluxe Room" },
    { value: "suite", label: "Suite" },
    { value: "presidential", label: "Presidential Suite" },
  ];

  const pickupFromOptions = [
    { value: "airport", label: "Airport" },
    { value: "city", label: "City" },
    { value: "hotel", label: "Hotel" },
    { value: "other", label: "Other" },
  ];

  const carTypeOptions = [
    { value: "economy", label: "Economy" },
    { value: "compact", label: "Compact" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "luxury", label: "Luxury" },
    { value: "van", label: "Van" },
  ];

  const eventTypeOptions = [
    { value: "conference", label: "Conference" },
    { value: "seminar", label: "Seminar" },
    { value: "workshop", label: "Workshop" },
    { value: "exhibition", label: "Exhibition" },
    { value: "concert", label: "Concert" },
    { value: "sports", label: "Sports Event" },
    { value: "other", label: "Other" },
  ];

  const packageOptions = packages
    .filter((pkg) => pkg.isActive)
    .map((pkg) => ({
      value: pkg.id.toString(),
      label: `${pkg.name} - ${pkg.destination} ($${pkg.price})`,
    }));

  const renderFlightFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Plane className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold">Flight Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.sourceCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">From City</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Delhi, Mumbai..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.destinationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">To City</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Paris, Dubai..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.flightType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Flight Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={flightTypeOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setIsRoundTrip(value === "round-trip");
                    }}
                    placeholder="Select type"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.passengers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Passengers</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.departureDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Departure</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isRoundTrip && (
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="typeSpecificData.returnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">Return</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.flightClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Class</FormLabel>
                <FormControl>
                  <Combobox
                    options={flightClassOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select class"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderHotelFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Hotel className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-semibold">Hotel Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Destination</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Paris, Dubai..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.preferredHotel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Preferred Hotel</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Hotel name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.checkInDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Check-in</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.checkOutDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Check-out</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4">
          <FormField
            control={form.control}
            name="typeSpecificData.rooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Rooms</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4">
          <FormField
            control={form.control}
            name="typeSpecificData.adults"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Adults</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4">
          <FormField
            control={form.control}
            name="typeSpecificData.children"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Children</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.roomType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Room Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={roomTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select room type"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderCarRentalFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Car className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold">Car Rental Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.pickupFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Pick-Up From</FormLabel>
                <FormControl>
                  <Combobox
                    options={pickupFromOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select location"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Pickup Location</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Location details"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.pickupDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Pick-Up Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.dropoffDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Drop-Off Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.carType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Car Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={carTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select car type"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderEventFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Event Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.eventName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Event Name</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Event name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Event Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={eventTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select type"
                    searchPlaceholder="Search..."
                    emptyText="No options"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.eventLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Location</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Event location" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Event Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.attendees"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Attendees</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="Number of attendees"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderPackageFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Package Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Destination</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Destination" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Duration</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="5 days, 7 nights" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.travelDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Travel Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.travelers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Travelers</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    type="text"
                    onKeyDown={handleNumericKeyDown}
                    placeholder="2" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.packageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Package Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={packageOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={packagesLoading ? "Loading..." : "Select package"}
                    searchPlaceholder="Search packages..."
                    emptyText="No packages available"
                    disabled={packagesLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Special Requirements</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Special requirements..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderAttractionFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Attraction Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.attractionLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">Location</FormLabel>
                <FormControl>
                  <Input 
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="City or location" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.fromDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">From Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderModuleFields = () => {
    switch (selectedCategory) {
      case "flight":
        return renderFlightFields();
      case "hotel":
        return renderHotelFields();
      case "package":
        return renderPackageFields();
      case "event":
        return renderEventFields();
      case "car-rental":
        return renderCarRentalFields();
      case "attraction":
        return renderAttractionFields();
      case "holiday":
        return renderPackageFields();
      default:
        return null;
    }
  };

  return (
    <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
      {renderModuleFields()}
    </div>
  );
}
