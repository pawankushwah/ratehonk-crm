import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { PackageType } from "@/lib/types";

const packageFormSchema = z
  .object({
    name: z.string().min(1, "Package name is required"),
    packageTypeId: z.number().min(1, "Package type is required"),
    noOfPax: z.number().min(1, "Number of passengers is required"),
    price: z.string().min(1, "Price is required"),
    durationType: z.enum(["with", "without"], {
      required_error: "Duration type is required",
    }),
    selectedDuration: z.number().optional(),
    region: z.string().min(1, "Region is required"),
    country: z.string().optional(),
    city: z.string().optional(),
    packageStayingImage: z.union([z.instanceof(File), z.string()]).optional(),
    altName: z.string().optional(),
    description: z.string().optional(),
    vendorName: z.string().optional(),
    rating: z.number().optional(),
    status: z.string().optional(),
    itineraryImages: z
      .union([
        z.array(z.instanceof(File)),
        z.array(z.string()),
        z.array(z.union([z.instanceof(File), z.string()])),
      ])
      .optional(),
    itineraryDescription: z.string().optional(),
    packageIncludes: z.string().optional(),
    packageExcludes: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    cancellationBenefit: z.string().optional(),
    dayWiseItinerary: z
      .array(
        z.object({
          day: z.number(),
          place: z.string().min(1, "Place is required"),
          itineraryImages: z
            .union([
              z.array(z.instanceof(File)),
              z.array(z.string()),
              z.array(z.union([z.instanceof(File), z.string()])),
            ])
            .optional(),
          itineraryDescription: z.string().optional(),
        })
      )
      .optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.durationType === "with" && !data.selectedDuration) {
        return false;
      }
      return true;
    },
    {
      message: "Duration is required when duration type is 'with'",
      path: ["selectedDuration"],
    }
  );

export default function PackageCreate() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Image selection state
  const [selectedPackageImage, setSelectedPackageImage] = useState<File | null>(null);
  const [selectedItineraryImages, setSelectedItineraryImages] = useState<File[]>([]);
  const [daysSummary, setDaysSummary] = useState<string[]>(["1 Place"]);
  const [dayWiseData, setDayWiseData] = useState<
    Array<{
      day: number;
      place: string;
      itineraryImages: (File | string)[];
      itineraryDescription: string;
    }>
  >([]);

  const form = useForm<z.infer<typeof packageFormSchema>>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      packageTypeId: 0,
      noOfPax: 1,
      price: "",
      durationType: "without",
      selectedDuration: undefined,
      region: "",
      country: "",
      city: "",
      packageStayingImage: "",
      altName: "",
      description: "",
      vendorName: "",
      rating: undefined,
      status: "",
      itineraryImages: [],
      itineraryDescription: "",
      packageIncludes: "",
      packageExcludes: "",
      cancellationPolicy: "",
      cancellationBenefit: "",
      isActive: true,
    },
  });

  // Generate duration options (1-31 days)
  const durationOptions = Array.from({ length: 31 }, (_, index) => {
    const days = index + 1;
    const nights = days - 1;
    return {
      value: days,
      label: `${days} Day${days > 1 ? "s" : ""} | ${nights} Night${nights > 1 ? "s" : ""}`,
    };
  });

  // Region options
  const regionOptions = [
    { value: "1", label: "Africa" },
    { value: "7", label: "Antarctica" },
    { value: "2", label: "Asia" },
    { value: "3", label: "Europe" },
    { value: "4", label: "North America" },
    { value: "6", label: "Oceania" },
    { value: "5", label: "South America" },
  ];

  const getRegionLabel = (regionValue: string) => {
    const region = regionOptions.find((option) => option.value === regionValue);
    return region ? region.label : regionValue;
  };

  const watchDurationType = form.watch("durationType");
  const watchSelectedDuration = form.watch("selectedDuration");

  useEffect(() => {
    if (watchDurationType === "with" && watchSelectedDuration) {
      const summaryArray = Array.from(
        { length: watchSelectedDuration },
        (_, index) => {
          if (index === 0) return "1 Place";
          return `${index + 1} Place`;
        }
      );
      setDaysSummary(summaryArray);

      const existingDayWise = form.getValues("dayWiseItinerary") || [];
      if (existingDayWise.length !== watchSelectedDuration) {
        const resizedDayWiseArray = Array.from(
          { length: watchSelectedDuration },
          (_, index) => {
            const existingEntry = existingDayWise[index];
            if (existingEntry) {
              return {
                ...existingEntry,
                day: index + 1,
              };
            } else {
              return {
                day: index + 1,
                place: "",
                itineraryImages: [] as (File | string)[],
                itineraryDescription: "",
              };
            }
          }
        );
        setDayWiseData(resizedDayWiseArray);
        form.setValue("dayWiseItinerary", resizedDayWiseArray);
      }
    } else {
      setDaysSummary(["1 Place"]);
      if (watchDurationType === "without") {
        setDayWiseData([]);
        form.setValue("dayWiseItinerary", []);
      }
    }
  }, [watchDurationType, watchSelectedDuration, form]);

  // Fetch package types
  const { data: packageTypes = [] } = useQuery<PackageType[]>({
    queryKey: [`/api/tenants/${tenant?.id}/package-types`],
    enabled: !!tenant?.id,
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.vendors || [];
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof packageFormSchema>) => {
      let processedItinerary = data.itineraryDescription || "";
      if (data.dayWiseItinerary && data.dayWiseItinerary.length > 0) {
        const itineraryTexts = data.dayWiseItinerary.map((day) => {
          const imageCount = day.itineraryImages ? day.itineraryImages.length : 0;
          const imageInfo = imageCount > 0 ? ` (${imageCount} images selected)` : "";
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? " - " + day.itineraryDescription : ""}`;
        });
        processedItinerary = itineraryTexts.join("\n");
      }

      const processedDayWiseItinerary = data.dayWiseItinerary
        ? data.dayWiseItinerary.map((day) => ({
            day: day.day,
            place: day.place,
            itineraryDescription: day.itineraryDescription || "",
            itineraryImageNames: "",
          }))
        : [];

      const formData = new FormData();
      formData.append("packageTypeId", (data.packageTypeId || 1).toString());
      formData.append("name", data.name);
      formData.append("description", data.description || processedItinerary || "Travel package");
      formData.append("destination", 
        `${getRegionLabel(data.region)}${data.country ? ", " + data.country : ""}${data.city ? ", " + data.city : ""}` ||
        "To be determined"
      );
      formData.append("duration", (data.selectedDuration || 1).toString());
      formData.append("price", parseFloat(data.price).toString() || "0");
      formData.append("maxCapacity", data.noOfPax.toString());
      formData.append("inclusions", data.packageIncludes || "");
      formData.append("exclusions", data.packageExcludes || "");
      formData.append("isActive", (data.isActive !== false).toString());
      formData.append("durationType", data.durationType || "");
      formData.append("region", data.region || "");
      formData.append("country", data.country || "");
      formData.append("city", data.city || "");
      formData.append("altName", data.altName || "");
      formData.append("vendorName", data.vendorName || "");
      if (data.rating) formData.append("rating", data.rating.toString());
      formData.append("status", data.status || "draft");
      formData.append("itineraryDescription", data.itineraryDescription || "");
      formData.append("cancellationPolicy", data.cancellationPolicy || "");
      formData.append("cancellationBenefit", data.cancellationBenefit || "");
      formData.append("itinerary", processedItinerary);
      formData.append("dayWiseItinerary", JSON.stringify(processedDayWiseItinerary));

      if (selectedPackageImage) {
        formData.append("packageStayingImage", selectedPackageImage);
      }

      selectedItineraryImages.forEach((file) => {
        formData.append("itineraryImages", file);
      });

      if (data.dayWiseItinerary && data.dayWiseItinerary.length > 0) {
        data.dayWiseItinerary.forEach((day, dayIndex) => {
          if (day.itineraryImages && Array.isArray(day.itineraryImages)) {
            day.itineraryImages.forEach((img) => {
              if (img instanceof File) {
                formData.append(`dayWiseItineraryImages[${dayIndex}]`, img);
              }
            });
          }
        });
      }

      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create package" }));
        throw new Error(errorData.message || "Failed to create package");
      }

      return response;
    },
    onSuccess: async (result: any) => {
      const createdPackage = await result.json();
      toast({
        title: "Success",
        description: "Package created successfully!",
      });
      // Invalidate and refetch packages list
      await queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      // Refetch to ensure data is up to date
      await queryClient.refetchQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      navigate("/packages");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create travel package",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof packageFormSchema>) => {
    createPackageMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/packages")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Create New Travel Package</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Package Type and Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="packageTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Type *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value ? field.value.toString() : ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Package Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {packageTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="European Adventure Tour" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="noOfPax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No of Pax *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="20"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input placeholder="$2,500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Duration Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="durationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Please Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="with">With Duration</SelectItem>
                                <SelectItem value="without">Without Duration</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchDurationType === "with" && (
                      <FormField
                        control={form.control}
                        name="selectedDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choose Duration</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Please Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {durationOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Location Section */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose Region *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Region" />
                              </SelectTrigger>
                              <SelectContent>
                                {regionOptions.map((region) => (
                                  <SelectItem key={region.value} value={region.value}>
                                    {region.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose City</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Day-wise Itinerary */}
                  {watchDurationType === "with" && watchSelectedDuration && (
                    <div className="border-t pt-6">
                      <FormLabel className="text-lg font-semibold mb-4 block">
                        Day-wise Itinerary
                      </FormLabel>
                      <div className="space-y-6">
                        {dayWiseData.map((dayData, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="text-base font-semibold mb-4">Day {dayData.day}</h4>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <FormLabel className="text-sm font-medium">Place *</FormLabel>
                                <Input
                                  placeholder="Place Name"
                                  value={dayData.place}
                                  onChange={(e) => {
                                    const updatedData = [...dayWiseData];
                                    updatedData[index].place = e.target.value;
                                    setDayWiseData(updatedData);
                                    form.setValue("dayWiseItinerary", updatedData);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <FormLabel className="text-sm font-medium">Itinerary Images</FormLabel>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    const updatedData = [...dayWiseData];
                                    updatedData[index].itineraryImages = [
                                      ...updatedData[index].itineraryImages,
                                      ...files,
                                    ];
                                    setDayWiseData(updatedData);
                                    form.setValue("dayWiseItinerary", updatedData);
                                  }}
                                  className="hidden"
                                  id={`itinerary-images-${dayData.day}`}
                                />
                                <label
                                  htmlFor={`itinerary-images-${dayData.day}`}
                                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-1"
                                >
                                  Choose images for Day {dayData.day}
                                </label>
                                {dayData.itineraryImages && dayData.itineraryImages.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">
                                      {dayData.itineraryImages.length} image(s) selected
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {dayData.itineraryImages.map((item, fileIndex) => {
                                        const isFile = item instanceof File;
                                        const displayName = isFile ? item.name : `Image ${fileIndex + 1}`;
                                        return (
                                          <div
                                            key={fileIndex}
                                            className="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
                                          >
                                            <span>{displayName}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updatedData = [...dayWiseData];
                                                updatedData[index].itineraryImages =
                                                  updatedData[index].itineraryImages.filter(
                                                    (_, i) => i !== fileIndex
                                                  );
                                                setDayWiseData(updatedData);
                                                form.setValue("dayWiseItinerary", updatedData);
                                              }}
                                              className="ml-2 text-red-500 hover:text-red-700"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <FormLabel className="text-sm font-medium">Itinerary Description</FormLabel>
                                <Textarea
                                  placeholder="Detailed description of the day's activities..."
                                  value={dayData.itineraryDescription}
                                  onChange={(e) => {
                                    const updatedData = [...dayWiseData];
                                    updatedData[index].itineraryDescription = e.target.value;
                                    setDayWiseData(updatedData);
                                    form.setValue("dayWiseItinerary", updatedData);
                                  }}
                                  className="mt-1 min-h-[80px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="packageStayingImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Staying Image</FormLabel>
                          <FormControl>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSelectedPackageImage(file);
                                    field.onChange(file);
                                  }
                                }}
                                className="hidden"
                                id="package-staying-image"
                              />
                              <label
                                htmlFor="package-staying-image"
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Choose Package Image
                              </label>
                              {selectedPackageImage && (
                                <div className="ml-2 text-sm text-gray-600">
                                  {selectedPackageImage.name}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="altName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alt Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Alternative name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explore the beautiful cities of Europe..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vendorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Name</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value === "none" ? "" : value);
                            }}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vendor..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No vendor</SelectItem>
                              {vendors
                                .filter((vendor: any) => vendor.name && vendor.name.trim() !== "")
                                .map((vendor: any) => (
                                  <SelectItem
                                    key={vendor.id}
                                    value={vendor.name || vendor.companyName || ""}
                                  >
                                    {vendor.name || vendor.companyName || "Unnamed Vendor"}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              placeholder="4.5"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="itineraryImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Itinerary Images</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setSelectedItineraryImages(files);
                                field.onChange(files);
                              }}
                              className="hidden"
                              id="itinerary-images"
                            />
                            <label
                              htmlFor="itinerary-images"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Choose Itinerary Images (multiple)
                            </label>
                            {selectedItineraryImages.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">
                                  {selectedItineraryImages.length} image(s) selected
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedItineraryImages.map((file, fileIndex) => (
                                    <div
                                      key={fileIndex}
                                      className="flex items-center bg-gray-100 rounded px-2 py-1 text-xs"
                                    >
                                      <span className="text-gray-700">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedFiles = selectedItineraryImages.filter(
                                            (_, i) => i !== fileIndex
                                          );
                                          setSelectedItineraryImages(updatedFiles);
                                          field.onChange(updatedFiles);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="itineraryDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Itinerary Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed itinerary description..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageIncludes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Includes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Hotels, Meals, Transportation..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageExcludes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Excludes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Flight tickets, Travel insurance..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cancellationPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Policy</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cancellation policy details..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cancellationBenefit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Benefit</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cancellation benefits..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active Status</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/packages")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPackageMutation.isPending}
                    >
                      {createPackageMutation.isPending ? "Creating..." : "Create Package"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

