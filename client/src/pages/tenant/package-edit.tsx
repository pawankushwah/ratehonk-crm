import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
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
import type { PackageType, TravelPackage } from "@/lib/types";

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

export default function PackageEdit() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/packages/edit/:id");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const packageId = params?.id ? parseInt(params.id) : null;

  // Image selection state
  const [selectedPackageImage, setSelectedPackageImage] = useState<File | null>(null);
  const [selectedItineraryImages, setSelectedItineraryImages] = useState<File[]>([]);
  const [uploadedPackageImage, setUploadedPackageImage] = useState<string>("");
  const [uploadedItineraryImages, setUploadedItineraryImages] = useState<string[]>([]);
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

  const durationOptions = Array.from({ length: 31 }, (_, index) => {
    const days = index + 1;
    const nights = days - 1;
    return {
      value: days,
      label: `${days} Day${days > 1 ? "s" : ""} | ${nights} Night${nights > 1 ? "s" : ""}`,
    };
  });

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
        (_, index) => `${index + 1} Place`
      );
      setDaysSummary(summaryArray);

      const existingDayWise = form.getValues("dayWiseItinerary") || [];
      if (existingDayWise.length !== watchSelectedDuration) {
        const resizedDayWiseArray = Array.from(
          { length: watchSelectedDuration },
          (_, index) => {
            const existingEntry = existingDayWise[index];
            if (existingEntry) {
              return { ...existingEntry, day: index + 1 };
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

  // Fetch package data
  const { data: packageData, isLoading: isLoadingPackage } = useQuery<TravelPackage>({
    queryKey: [`/api/tenants/${tenant?.id}/packages/${packageId}`],
    enabled: !!tenant?.id && !!packageId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch package");
      return response.json();
    },
  });

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

  // Populate form when package data loads
  useEffect(() => {
    if (packageData) {
      setUploadedPackageImage(packageData.packageStayingImage || "");

      let existingItineraryImages: string[] = [];
      if (Array.isArray(packageData.itineraryImages)) {
        existingItineraryImages = packageData.itineraryImages;
      } else if (typeof packageData.itineraryImages === "string" && packageData.itineraryImages) {
        existingItineraryImages = packageData.itineraryImages
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img);
      }
      setUploadedItineraryImages(existingItineraryImages);

      const existingInclusions =
        typeof packageData.inclusions === "string"
          ? packageData.inclusions
          : Array.isArray(packageData.inclusions)
          ? packageData.inclusions.join("\n")
          : "";

      const existingExclusions =
        typeof packageData.exclusions === "string"
          ? packageData.exclusions
          : Array.isArray(packageData.exclusions)
          ? packageData.exclusions.join("\n")
          : "";

      const parsedDayWise =
        typeof packageData.dayWiseItinerary === "string"
          ? JSON.parse(packageData.dayWiseItinerary)
          : packageData.dayWiseItinerary || [];

      const dayWiseForForm = Array.isArray(parsedDayWise)
        ? parsedDayWise.map((day: any) => {
            let dayImages: (File | string)[] = [];
            if (day.itineraryImageNames) {
              dayImages =
                typeof day.itineraryImageNames === "string"
                  ? day.itineraryImageNames
                      .split(",")
                      .map((url: string) => url.trim())
                      .filter((url: string) => url)
                  : Array.isArray(day.itineraryImageNames)
                  ? day.itineraryImageNames
                  : [];
            }
            return {
              day: day.day,
              place: day.place,
              itineraryImages: dayImages,
              itineraryDescription: day.itineraryDescription || "",
            };
          })
        : [];

      setDayWiseData(dayWiseForForm);

      form.reset({
        name: packageData.name,
        packageTypeId: packageData.packageTypeId || 0,
        noOfPax: packageData.maxCapacity || 1,
        price: packageData.price?.toString() || "",
        durationType: packageData.durationType || "without",
        selectedDuration: packageData.duration || undefined,
        region: packageData.region || "",
        country: packageData.country || "",
        city: packageData.city || "",
        packageStayingImage: packageData.packageStayingImage || "",
        altName: packageData.altName || "",
        description: packageData.description || "",
        vendorName: packageData.vendorName || "",
        rating: packageData.rating || undefined,
        status: packageData.status || "",
        itineraryImages: existingItineraryImages as (File | string)[],
        itineraryDescription: packageData.itineraryDescription || "",
        packageIncludes: existingInclusions,
        packageExcludes: existingExclusions,
        cancellationPolicy: packageData.cancellationPolicy || "",
        cancellationBenefit: packageData.cancellationBenefit || "",
        dayWiseItinerary: dayWiseForForm,
        isActive: packageData.isActive !== false,
      });
    }
  }, [packageData, form]);

  const updatePackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof packageFormSchema>) => {
      // Process itinerary text
      let processedItinerary = data.itineraryDescription || "";
      if (dayWiseData && dayWiseData.length > 0) {
        const itineraryTexts = dayWiseData.map((day) => {
          const imageCount = day.itineraryImages ? day.itineraryImages.length : 0;
          const imageInfo = imageCount > 0 ? ` (${imageCount} images selected)` : "";
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? " - " + day.itineraryDescription : ""}`;
        });
        processedItinerary = itineraryTexts.join("\n");
      }

      // Similar to create, prepare FormData or JSON based on whether images are involved
      const hasNewImages = selectedPackageImage || selectedItineraryImages.length > 0 ||
        dayWiseData.some(day => day.itineraryImages.some(img => img instanceof File));

      if (hasNewImages) {
        // Use FormData if new images
        const formData = new FormData();
        // Add all fields similar to create
        formData.append("packageTypeId", (data.packageTypeId || 1).toString());
        formData.append("name", data.name);
        formData.append("description", data.description || processedItinerary || "");
        formData.append("destination", 
          `${getRegionLabel(data.region)}${data.country ? ", " + data.country : ""}${data.city ? ", " + data.city : ""}`
        );
        formData.append("duration", (data.selectedDuration || 1).toString());
        formData.append("price", parseFloat(data.price).toString());
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

        if (selectedPackageImage) {
          formData.append("packageStayingImage", selectedPackageImage);
        } else if (uploadedPackageImage) {
          formData.append("packageStayingImage", uploadedPackageImage);
        }

        // Handle itinerary images
        selectedItineraryImages.forEach((file) => {
          formData.append("itineraryImages", file);
        });

        // Handle day-wise itinerary images
        dayWiseData.forEach((dayData, dayIndex) => {
          dayData.itineraryImages.forEach((img) => {
            if (img instanceof File) {
              formData.append(`dayWiseItineraryImages[${dayIndex}]`, img);
            }
          });
        });

        // Add day-wise itinerary data as JSON
        const dayWiseItineraryForSubmit = dayWiseData.map((day) => ({
          day: day.day,
          place: day.place,
          itineraryDescription: day.itineraryDescription,
          itineraryImageNames: day.itineraryImages
            .filter((img) => typeof img === "string")
            .join(","),
        }));
        formData.append("dayWiseItinerary", JSON.stringify(dayWiseItineraryForSubmit));

        const token = auth.getToken();
        const response = await fetch(`/api/tenants/${tenant?.id}/packages/${packageId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to update package");
        return response.json();
      } else {
        // No new images, use JSON
        const token = auth.getToken();
        const response = await fetch(`/api/tenants/${tenant?.id}/packages/${packageId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            packageTypeId: data.packageTypeId || 1,
            name: data.name,
            description: data.description,
            destination: `${getRegionLabel(data.region)}${data.country ? ", " + data.country : ""}${data.city ? ", " + data.city : ""}`,
            duration: data.selectedDuration || 1,
            price: parseFloat(data.price),
            maxCapacity: data.noOfPax,
            inclusions: data.packageIncludes,
            exclusions: data.packageExcludes,
            isActive: data.isActive !== false,
            durationType: data.durationType || "",
            region: data.region || "",
            country: data.country || "",
            city: data.city || "",
            altName: data.altName || "",
            vendorName: data.vendorName || "",
            rating: data.rating || undefined,
            status: data.status || "draft",
            itineraryDescription: data.itineraryDescription || "",
            cancellationPolicy: data.cancellationPolicy || "",
            cancellationBenefit: data.cancellationBenefit || "",
            dayWiseItinerary: dayWiseData.map((day) => ({
              day: day.day,
              place: day.place,
              itineraryDescription: day.itineraryDescription,
              itineraryImageNames: day.itineraryImages
                .filter((img) => typeof img === "string")
                .join(","),
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to update package");
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Package updated successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      navigate("/packages");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof packageFormSchema>) => {
    updatePackageMutation.mutate(data);
  };

  if (isLoadingPackage) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <div className="text-center">Loading package...</div>
        </div>
      </Layout>
    );
  }

  if (!packageData) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <div className="text-center text-red-500">Package not found</div>
          <Button onClick={() => navigate("/packages")} className="mt-4">
            Back to Packages
          </Button>
        </div>
      </Layout>
    );
  }

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
              <CardTitle>Edit Travel Package</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Similar form structure as create page */}
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
                                        const isExisting = typeof item === "string";
                                        const displayName = isFile ? item.name : `Image ${fileIndex + 1}${isExisting ? " (existing)" : ""}`;
                                        return (
                                          <div
                                            key={fileIndex}
                                            className={`flex items-center rounded px-2 py-1 text-xs ${
                                              isExisting
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
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
                                {selectedPackageImage ? "Replace Package Image" : uploadedPackageImage ? "Replace Package Image" : "Choose Package Image"}
                              </label>
                              {selectedPackageImage && (
                                <div className="ml-2 text-sm text-gray-600">
                                  New: {selectedPackageImage.name}
                                </div>
                              )}
                              {uploadedPackageImage && !selectedPackageImage && (
                                <div className="ml-2 text-sm text-green-600">
                                  ✓ Current image uploaded
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
                                field.onChange([...uploadedItineraryImages, ...files]);
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
                            {(selectedItineraryImages.length > 0 || uploadedItineraryImages.length > 0) && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">
                                  {selectedItineraryImages.length + uploadedItineraryImages.length} image(s) total
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {uploadedItineraryImages.map((url, urlIndex) => (
                                    <div
                                      key={`existing-${urlIndex}`}
                                      className="flex items-center bg-blue-100 rounded px-2 py-1 text-xs"
                                    >
                                      <span className="text-blue-800">Image {urlIndex + 1} (existing)</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUrls = uploadedItineraryImages.filter(
                                            (_, i) => i !== urlIndex
                                          );
                                          setUploadedItineraryImages(updatedUrls);
                                          field.onChange([...updatedUrls, ...selectedItineraryImages]);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  {selectedItineraryImages.map((file, fileIndex) => (
                                    <div
                                      key={`new-${fileIndex}`}
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
                                          field.onChange([...uploadedItineraryImages, ...updatedFiles]);
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
                      disabled={updatePackageMutation.isPending}
                    >
                      {updatePackageMutation.isPending ? "Updating..." : "Update Package"}
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

