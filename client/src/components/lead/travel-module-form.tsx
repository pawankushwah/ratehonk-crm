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
import { CalendarIcon, Plus, Hotel, Car, Plane, X } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("one-way");
  const [cities, setCities] = useState([{ from: "", to: "", date: "" }]);

  const [economyType, setEconomyType] = useState("Economy");
  const [showEconomy, setShowEconomy] = useState(false);
  const [alternateDays, setAlternateDays] = useState("Alternate Days");
  const [showAlternate, setShowAlternate] = useState(false);
  const [directFlight, setDirectFlight] = useState(false);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    form.setValue("typeSpecificData.flightType", tab);

    // Reset cities array based on flight type
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

  const renderFlightFields = () => (
    <div className="space-y-6">
      <div className="w-full flex gap-2 bg-white">
        {flightTypeOptions.map((option) => (
          <button
            key={option.value}
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

        <div className="col-span-3">
          <FormField
            control={form.control}
            name="typeSpecificData.flightClass"
            render={({ field }) => (
              <FormItem>
                
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

        

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlternate((p) => !p)}
            className="
          w-[150px] h-[40px] bg-white border border-gray-300 rounded-lg 
          px-3 text-sm flex items-center justify-between shadow-sm
        "
          >
            {alternateDays}
            <i className="ri-arrow-down-s-line text-gray-500"></i>
          </button>

          {showAlternate && (
            <div className="absolute mt-1 w-[150px] bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              {["None", "Alternate Days", "Flexible"].map((opt) => (
                <div
                  key={opt}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setAlternateDays(opt);
                    setShowAlternate(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Flight Switch */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Direct Flight</span>

          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={directFlight}
              onChange={(e) => setDirectFlight(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className="
            w-10 h-5 bg-gray-300 rounded-full relative 
            peer-checked:bg-[#1C75BC]
            after:absolute after:top-[2px] after:left-[2px]
            after:w-4 after:h-4 after:bg-white after:rounded-full
            after:transition-all peer-checked:after:translate-x-5
          "
            ></div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3"></div>

      {/* Flight Routes */}
      <div className="space-y-4">
        {cities.map((city, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-end">
            {/* From City */}
            <div className="col-span-4">
              <FormField
                control={form.control}
                name={`typeSpecificData.sourceCity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                      From
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter City"
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
                name={`typeSpecificData.destinationCity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                      To
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter City"
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
                name={`typeSpecificData.departureDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                      Departure
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            className={cn(
                              "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
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
                            "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
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

        {/* Flight Class */}
        {/* <div className="col-span-3">
          <FormField
            control={form.control}
            name="typeSpecificData.flightClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block text-gray-700">
                  Class
                </FormLabel>
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
        </div> */}
      </div>
    </div>
  );

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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Destination
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Duration
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Travel Date
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

        <div className="col-span-6">
          <FormField
            control={form.control}
            name="typeSpecificData.travelers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Travelers
                </FormLabel>
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
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Package Type
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={packageOptions}
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

        <div className="col-span-12">
          <FormField
            control={form.control}
            name="typeSpecificData.specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  Special Requirements
                </FormLabel>
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

  const renderModuleFields = () => {
    console.log("selectedCategory :",selectedCategory)
    switch (selectedCategory) {
      case "flight":
        return renderFlightFields();
      case "hotel":
        return renderHotelFields();
      case "package":
        return renderPackageFields();
      case "event":
        return renderEventFields();
      case "Car Rental":
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
