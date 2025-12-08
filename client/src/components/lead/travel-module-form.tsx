import { useEffect, useState, useRef } from "react";
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
  Plus,
  Hotel,
  Car,
  Plane,
  X,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn, handleNumericKeyDown } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import type { TravelPackage } from "@/lib/types";
import { useForm, useFieldArray } from "react-hook-form";

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
  console.log("selectedCategory", selectedCategory);
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("one-way");
  const [cities, setCities] = useState([{ from: "", to: "", date: "" }]);

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

  const staticPackageTypes = [
    "Adventure Tours",
    "Family Packages",
    "Business Travel",
    "Luxury Tours",
    "Honeymoon Packages",
    "Group Tours",
    "Weekend Getaways",
    "International Tours",
    "Domestic Tours",
    "Pilgrimage Tours",
    "Educational Tours",
    "Corporate Packages",
  ];

  const staticOptions = staticPackageTypes.map((name, index) => ({
    value: name,
    label: name,
  }));

  const packageOptions = packages
    .filter((pkg) => pkg.isActive)
    .map((pkg) => ({
      value: pkg.id.toString(),
      label: `${pkg.name} - ${pkg.destination} ($${pkg.price})`,
    }));
  const finalPackageOptions = [...staticOptions, ...packageOptions];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    form.setValue("typeSpecificData.flightType", tab);

    if (tab === "one-way" || tab === "round-trip") {
      setCities([{ from: "", to: "", date: "" }]);
    }
  };

  const addCity = () => {
    setCities([...cities, { from: "", to: "", date: "" }]);
  };

  const removeCity = (index: number) => {
    if (cities.length > 1) {
      const newCities = cities.filter((_, i) => i !== index);
      setCities(newCities);
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
      e.preventDefault();
    }
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "typeSpecificData.activities",
  });

  const locationValue = form.watch("typeSpecificData.attractionLocation");
  const dateRangeValue = form.watch("typeSpecificData.dateRange");

  const autoAddedRef = useRef(false);
  useEffect(() => {
    const hasLocation = !!locationValue?.trim();
    const hasDateRange = dateRangeValue?.from && dateRangeValue?.to;

    if (hasLocation && hasDateRange && !autoAddedRef.current) {
      autoAddedRef.current = true;
    }

    if (!hasLocation || !hasDateRange) {
      autoAddedRef.current = false;
    }
  }, [locationValue, dateRangeValue, append]);

  const showActivities =
    locationValue?.trim() && dateRangeValue?.from && dateRangeValue?.to;

  //for flight
  const renderFlightFields = () => (
    <div className="space-y-6">
      <div className="w-full flex gap-4 items-end flex-wrap">
        {flightTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleTabChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition",
              activeTab === option.value
                ? "bg-[#1C75BC] text-white border-[#1C75BC]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            )}
          >
            {option.label}
          </button>
        ))}

        <div className="flex-1 ">
          <FormField
            control={form.control}
            name="typeSpecificData.flightClass"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="w-40">
                    <Combobox
                      options={flightClassOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Select class"
                      searchPlaceholder="Search..."
                      emptyText="No options"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        {cities.map((city, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name={`typeSpecificData.sourceCity${index + 1}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                      From
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter City"
                        className="h-12 rounded-lg px-3"
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
                name={`typeSpecificData.destinationCity${index + 1}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                      To
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter City"
                        className="h-12 rounded-lg px-3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-3">
              <FormField
                control={form.control}
                name={`typeSpecificData.dateRange`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block">
                      Date Range
                    </FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="h-10 w-full justify-between rounded-lg border text-left font-normal overflow-hidden"
                          >
                            {field.value?.from ? (
                              field.value.to ? (
                                `${format(new Date(field.value.from), "PP")} → ${format(
                                  new Date(field.value.to),
                                  "PP"
                                )}`
                              ) : (
                                format(new Date(field.value.from), "PP")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}

                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="range"
                          selected={field.value}
                          onSelect={(range) => {
                            if (!range) return field.onChange(null);

                            field.onChange({
                              from: range.from ? new Date(range.from) : null,
                              to: range.to ? new Date(range.to) : null,
                            });
                          }}
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

            {activeTab === "multi-city" && cities.length > 1 && (
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeCity(index)}
                  className="h-12 w-12 text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {activeTab === "multi-city" && (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={addCity}
              className="h-12 px-6 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </div>
        )}
      </div>

      {activeTab === "round-trip" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <FormField
              control={form.control}
              name="typeSpecificData.returnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                    Return
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          className={cn(
                            "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 text-black bg-white px-3 py-2 text-sm font-normal shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            !field.value && "text-gray-500"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>Select date</span>
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
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <FormField
            control={form.control}
            name="typeSpecificData.travelers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                  Travelers
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-12 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>
    </div>
  );

  // for hotel
  const renderHotelFields = () => (
    <div className="space-y-3">
      <div
        className="
      border border-[#E3E8EF] rounded-lg bg-white
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      w-full lg:h-[90px]
    "
      >
        <div className="border-b md:border-b-0 md:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Going To
          </FormLabel>
          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0 focus:ring-0 shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>

        <div className="border-b lg:border-b-0 lg:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Check In
          </FormLabel>

          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0  shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>

        <div className="p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Check Out
          </FormLabel>

          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0 focus:ring-0 shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>
      </div>

      <div
        className="
      grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            No. of Nights
          </FormLabel>
          <Input
            placeholder="Enter Number of Nights"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.nights")}
          />
        </div>

        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Guests and Rooms
          </FormLabel>
          <Input
            placeholder="2 Adults, 1 Room"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.guests")}
          />
        </div>
      </div>
    </div>
  );

  // for car
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Pick-Up From
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Pickup Location
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Pick-Up Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center text-black justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Drop-Off Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between text-black rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Car Type
                </FormLabel>
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

  //for event

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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Event Name
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Event Type
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Location
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Event Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between text-black rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Attendees
                </FormLabel>
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

  // for holidays
  const renderHolidaysFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Holidays Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.eventLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Location
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input"
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Event Date
                </FormLabel>

                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center text-black justify-between rounded-lg border border-input bg-background px-3 text-sm font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick date"}
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
            name="typeSpecificData.packageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Package Type
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={finalPackageOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={
                      packagesLoading ? "Loading..." : "Select package"
                    }
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

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Duration
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                  >
                    <option value="">All Duration</option>
                    <option value="1-3">1–3 days</option>
                    <option value="4-7">4–7 days</option>
                    <option value="8-12">8–12 days</option>
                    <option value="12+">12+ days</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Budget
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className="h-10 rounded-lg px-3 py-2 border border-input"
                    placeholder="Enter budget"
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

  // for package
  const renderPackageFields = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Package Details</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold">Flight Details</h3>
        </div>
      </div>
      {renderFlightFields()}

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold">Hotels Details</h3>
        </div>
      </div>

      {renderHotelFields()}
    </div>
  );

  // for attraction
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Location
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  From Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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

  // for Activities
  const renderActivitiesFields = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold">Activities Details</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.attractionLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Location
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="City or location"
                    className="h-10 rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-3">
          <FormField
            control={form.control}
            name={`typeSpecificData.dateRange`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Date Range
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-between rounded-lg border text-left font-normal overflow-hidden"
                      >
                        {field.value?.from ? (
                          field.value.to ? (
                            `${format(new Date(field.value.from), "PP")} → ${format(
                              new Date(field.value.to),
                              "PP" 
                            )}`
                          ) : (
                            format(new Date(field.value.from), "PP")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}

                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent align="start" className="p-0">
                    <Calendar
                      mode="range"
                      selected={field.value}
                      onSelect={(range) => {
                        if (!range) return field.onChange(null);

                        field.onChange({
                          from: range.from ? new Date(range.from) : null,
                          to: range.to ? new Date(range.to) : null,
                        });
                      }}
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

      {showActivities && (
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-semibold">Activities</h4>

          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7">
                <FormField
                  control={form.control}
                  name={`typeSpecificData.activityName${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter activity name"
                          className="h-10 rounded-lg"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-4">
                <FormField
                  control={form.control}
                  name={`typeSpecificData.activityDatetime${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="h-10 w-full justify-between rounded-lg border px-3 text-left font-normal"
                            >
                              {field.value
                                ? format(field.value, "PPP p")
                                : "Pick date & time"}

                              <CalendarIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="p-0 w-auto">
                          <div className="p-3 space-y-3">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) =>
                                field.onChange(
                                  date
                                    ? new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate(),
                                        field.value?.getHours() ?? 12,
                                        field.value?.getMinutes() ?? 0
                                      )
                                    : null
                                )
                              }
                              disabled={(date) => date < new Date()}
                            />

                            <Input
                              type="time"
                              className="h-9"
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(":");
                                const date = field.value || new Date();

                                field.onChange(
                                  new Date(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate(),
                                    Number(h),
                                    Number(m)
                                  )
                                );
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => remove(index)}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() =>
              append({
                name: "",
                datetime: null,
              })
            }
          >
            + Add Activity
          </Button>
        </div>
      )}
    </div>
  );
// for insurance
  const renderInsuranceFields = () => (
    <div className="space-y-3">
      <div
        className="
      border border-[#E3E8EF] rounded-lg bg-white
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2
      w-full lg:h-[90px]
    "
      >
        <div className="border-b md:border-b-0 md:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            From
          </FormLabel>
          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0 focus:ring-0 shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>

        <div className="border-b lg:border-b-0 lg:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            To
          </FormLabel>

          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0  shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>
      </div>

      <div
        className="
      grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Customer Name
          </FormLabel>
          <Input
            placeholder="Enter Customer Name"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.CustomerName")}
          />
        </div>

        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Age
          </FormLabel>
          <Input
            placeholder="Enter the Age"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.Age")}
          />
        </div>
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Nationality
          </FormLabel>
          <Input
            placeholder="Enter Nationality"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.Nationality")}
          />
        </div>
      </div>

      <div
        className="
      grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Type of Insurance
          </FormLabel>
          <Input
            placeholder="Enter Type of Insurance"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.TypeofInsurance")}
          />
        </div>
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Travelers
          </FormLabel>
          <Input
            placeholder="Enter Numbers Travelers"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.Travelers")}
          />
        </div>
      </div>
    </div>
  );
  // for cruise
  const renderCruiseFields = () => (
    <div className="space-y-3">
      <div
        className="
      grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormField
            control={form.control}
            name="typeSpecificData.pickupDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Pick-Up Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between text-black rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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

        <div>
          <FormField
            control={form.control}
            name="typeSpecificData.dropoffDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Drop-Off Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "flex h-10 w-full items-center justify-between text-black rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                          !field.value && "text-muted-foreground"
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

        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            From (nights)
          </FormLabel>
          <Input
            placeholder="From(nights)"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.From(nights)")}
          />
        </div>
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            To (nights)
          </FormLabel>
          <Input
            placeholder=" To (nights)"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.To(nights)")}
          />
        </div>
      </div>
      <div
        className="
      border border-[#E3E8EF] rounded-lg bg-white
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      w-full lg:h-[90px]
    "
      >
        <div className="border-b md:border-b-0 md:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Going To
          </FormLabel>
          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0 focus:ring-0 shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>

        <div className="border-b lg:border-b-0 lg:border-r border-[#E3E8EF] p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Check In
          </FormLabel>

          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0  shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>

        <div className="p-4 flex flex-col justify-center">
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Check Out
          </FormLabel>

          <Input
            placeholder="Enter City"
            className="
          h-10 bg-transparent border-none p-0 focus:ring-0 shadow-none
        "
            {...form.register("typeSpecificData.destination")}
          />
        </div>
      </div>

      <div
        className="
      grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Embarkation park
          </FormLabel>
          <Input
            placeholder="Enter  Embarkation park"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData. Embarkation park")}
          />
        </div>

        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Port of Call
          </FormLabel>
          <Input
            placeholder="Enter Port of Call"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.PortofCall")}
          />
        </div>

        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Marketing Code
          </FormLabel>
          <Input
            placeholder="Enter Marketing Code"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.MarketingCode")}
          />
        </div>
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            Vender sailing identify
          </FormLabel>
          <Input
            placeholder="Enter Nationality"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.Nationality")}
          />
        </div>
      </div>

      <div
        className="
      grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[17px]
      w-full
    "
      >
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            From (price)
          </FormLabel>
          <Input
            placeholder="Enter From (price)"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData.From(price)")}
          />
        </div>
        <div>
          <FormLabel className="text-xs font-semibold text-gray-700 mb-1">
            to (price)
          </FormLabel>
          <Input
            placeholder="Enter  to (price)"
            className="h-10 rounded-md"
            {...form.register("typeSpecificData. to(price)")}
          />
        </div>
      </div>
    </div>
  );
  // Render fields based on selected category
  const renderModuleFields = () => {
    console.log("selectedCategory :", selectedCategory);
    switch (selectedCategory) {
      case "flight":
        return renderFlightFields();
      case "hotel":
        return renderHotelFields();
      case "package":
        return renderPackageFields();
      case "holiday":
        return renderHolidaysFields();
      case "Car Rental":
        return renderCarRentalFields();
      case "attraction":
        return renderAttractionFields();
      case "Event Booking":
        return renderEventFields();
      case "Activities":
        return renderActivitiesFields();
      case "Insurance":
        return renderInsuranceFields();
      case "Cruise":
        return renderCruiseFields();
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
