import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Eye,
  Settings,
  Grid3X3,
  List,
  Star,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Upload,
  FileDown,
  Send,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { TravelPackage, PackageType } from "@/lib/types";
import { SendPackageDialog } from "@/components/packages/send-package-dialog";

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
    // Dynamic day-by-day itinerary
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
      // Require selectedDuration when durationType is "with"
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

export default function TravelPackages() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Image selection state (files selected but not uploaded yet)
  const [selectedPackageImage, setSelectedPackageImage] = useState<File | null>(
    null
  );
  const [selectedItineraryImages, setSelectedItineraryImages] = useState<
    File[]
  >([]);
  // For display of already uploaded images in edit mode
  const [uploadedPackageImage, setUploadedPackageImage] = useState<string>("");
  const [uploadedItineraryImages, setUploadedItineraryImages] = useState<
    string[]
  >([]);
  const [daysSummary, setDaysSummary] = useState<string[]>(["1 Place"]);
  const [dayWiseData, setDayWiseData] = useState<
    Array<{
      day: number;
      place: string;
      itineraryImages: (File | string)[]; // Support both File objects and URL strings
      itineraryDescription: string;
    }>
  >([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Send package dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);

  // Import handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Error",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      setImportFile(file);
    }
  };

  const handleDownloadSampleFile = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/packages/import/sample`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download sample file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "packages-import-sample.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Sample file downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download sample file",
        variant: "destructive",
      });
    }
  };

  const handleImportPackages = async () => {
    if (!importFile || !tenant?.id) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("tenantId", tenant.id.toString());

      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/packages/import`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import packages");
      }

      toast({
        title: "Success",
        description: `Successfully imported ${result.imported || 0} travel packages`,
      });

      // Refresh packages list
      queryClient.invalidateQueries({
        queryKey: ["packages", tenant.id],
      });

      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import packages",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Export packages handler - CSV
  const handleExportPackagesCSV = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/packages/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export packages");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packages-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Packages exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export packages",
        variant: "destructive",
      });
    }
  };

  // Export packages handler - Excel
  const handleExportPackagesExcel = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/packages/export?format=xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export packages");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packages-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Packages exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export packages",
        variant: "destructive",
      });
    }
  };

  // Export packages handler - PDF
  const handleExportPackagesPDF = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/packages/export?format=pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export packages");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packages-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Packages exported to PDF successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export packages",
        variant: "destructive",
      });
    }
  };

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

  // Helper function to get region label from numeric value
  const getRegionLabel = (regionValue: string) => {
    const region = regionOptions.find((option) => option.value === regionValue);
    return region ? region.label : regionValue; // fallback to original value if not found
  };

  // Watch for duration changes to update days summary
  const watchDurationType = form.watch("durationType");
  const watchSelectedDuration = form.watch("selectedDuration");

  // Update days summary and initialize day-wise data when duration changes
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

      // Handle resizing of day-wise data during edit when duration changes
      if (existingDayWise.length !== watchSelectedDuration) {
        const resizedDayWiseArray = Array.from(
          { length: watchSelectedDuration },
          (_, index) => {
            // Keep existing data if available, otherwise create new entry
            const existingEntry = existingDayWise[index];
            if (existingEntry) {
              return {
                ...existingEntry,
                day: index + 1, // Ensure day numbers are correct
              };
            } else {
              // Create new entry for additional days
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
      // Only clear data if we're switching from "with" to "without"
      if (watchDurationType === "without") {
        setDayWiseData([]);
        form.setValue("dayWiseItinerary", []);
      }
    }
  }, [watchDurationType, watchSelectedDuration, form]);

  // Fetch travel packages
  const { data: packages = [], isLoading } = useQuery<TravelPackage[]>({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      console.log("Fetching packages for tenant:", tenant?.id);
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch travel packages");
      const data = await response.json();
      console.log("Raw packages data from API:", data);
      // The API already returns camelCase, no need to transform
      return data;
    },
  });

  // Fetch package types for dropdown
  const { data: packageTypes = [] } = useQuery<PackageType[]>({
    queryKey: [`/api/tenants/${tenant?.id}/package-types`],
    enabled: !!tenant?.id,
  });

  // Fetch vendors for dropdown
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
      // Process day-wise itinerary data into combined description
      let processedItinerary = data.itineraryDescription || "";
      if (data.dayWiseItinerary && data.dayWiseItinerary.length > 0) {
        const itineraryTexts = data.dayWiseItinerary.map((day) => {
          const imageCount = day.itineraryImages
            ? day.itineraryImages.length
            : 0;
          const imageInfo =
            imageCount > 0 ? ` (${imageCount} images selected)` : "";
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? " - " + day.itineraryDescription : ""}`;
        });
        processedItinerary = itineraryTexts.join("\n");
      }

      // Process day-wise itinerary data
      const processedDayWiseItinerary = data.dayWiseItinerary
        ? data.dayWiseItinerary.map((day) => ({
            day: day.day,
            place: day.place,
            itineraryDescription: day.itineraryDescription || "",
            itineraryImageNames: "", // Will be set after upload
          }))
        : [];

      // Create FormData to send all data including images in one request
      const formData = new FormData();

      // Add all text fields
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

      // Add package staying image
      if (selectedPackageImage) {
        formData.append("packageStayingImage", selectedPackageImage);
      }

      // Add general itinerary images
      selectedItineraryImages.forEach((file) => {
        formData.append("itineraryImages", file);
      });

      // Add day-wise itinerary images
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

      // Send FormData with all images in one request
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it with boundary for FormData
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
      console.log("Package created successfully with all images:", createdPackage);

      toast({
        title: "Success",
        description: "Package created successfully with all images!",
      });

      // Refresh the packages list
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });


      // Reset image selection states
      setSelectedPackageImage(null);
      setSelectedItineraryImages([]);
      setDayWiseData([]);
      setDaysSummary(["1 Place"]);

      // Reset form to blank values after successful creation
      form.reset({
        name: "",
        packageTypeId: 0,
        noOfPax: 1,
        price: "",
        durationType: "without",
        selectedDuration: undefined,
        region: "",
        country: "",
        city: "",
        packageStayingImage: undefined,
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
        dayWiseItinerary: [],
        isActive: true,
      });
      console.log("Package creation complete - form and upload states reset");
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

  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      return apiRequest(
        "DELETE",
        `/api/tenants/${tenant?.id}/packages/${packageId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      toast({
        title: "Success",
        description: "Travel package deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete travel package",
        variant: "destructive",
      });
    },
  });

  // Helper function to check if value is a File object
  const isFileObject = (value: any): value is File => {
    return value instanceof File;
  };

  // Helper function to separate File objects from URL strings
  const separateFilesAndUrls = (
    items: any[]
  ): { files: File[]; urls: string[] } => {
    const files: File[] = [];
    const urls: string[] = [];

    items.forEach((item) => {
      if (isFileObject(item)) {
        files.push(item);
      } else if (typeof item === "string" && item.trim()) {
        urls.push(item.trim());
      }
    });

    return { files, urls };
  };

  // Enhanced image upload function for edit with mixed content handling
  const uploadEditPackageImages = async (
    packageId: number,
    packageData: z.infer<typeof packageFormSchema>
  ) => {
    const imageUrls: any = {};

    try {
      // Handle package staying image - could be File or existing URL
      if (packageData.packageStayingImage) {
        if (isFileObject(packageData.packageStayingImage)) {
          console.log("Uploading new package image...");
          imageUrls.packageStayingImage = await uploadImageToServer(
            packageData.packageStayingImage
          );
        } else if (typeof packageData.packageStayingImage === "string") {
          // Keep existing URL
          imageUrls.packageStayingImage = packageData.packageStayingImage;
        }
      }

      // Handle general itinerary images - mixed File[] and string[]
      if (
        packageData.itineraryImages &&
        Array.isArray(packageData.itineraryImages)
      ) {
        const { files: newFiles, urls: existingUrls } = separateFilesAndUrls(
          packageData.itineraryImages
        );

        let allUrls = [...existingUrls];

        if (newFiles.length > 0) {
          console.log("Uploading new itinerary images...");
          const newUrls = await Promise.all(
            newFiles.map((file) => uploadImageToServer(file))
          );
          allUrls = [...allUrls, ...newUrls];
        }

        imageUrls.itineraryImages = allUrls.join(", ");
      }

      // Handle day-wise images - mixed content in each day
      if (
        packageData.dayWiseItinerary &&
        packageData.dayWiseItinerary.length > 0
      ) {
        console.log("Processing day-wise images...");
        const processedDayWiseItinerary = await Promise.all(
          packageData.dayWiseItinerary.map(async (day) => {
            let allDayUrls: string[] = [];

            if (day.itineraryImages && Array.isArray(day.itineraryImages)) {
              const { files: newFiles, urls: existingUrls } =
                separateFilesAndUrls(day.itineraryImages);

              allDayUrls = [...existingUrls];

              if (newFiles.length > 0) {
                const newUrls = await Promise.all(
                  newFiles.map((file) => uploadImageToServer(file))
                );
                allDayUrls = [...allDayUrls, ...newUrls];
              }
            }

            return {
              day: day.day,
              place: day.place,
              itineraryDescription: day.itineraryDescription || "",
              itineraryImageNames: allDayUrls.join(", "),
            };
          })
        );
        imageUrls.dayWiseItinerary = processedDayWiseItinerary;
      }

      return imageUrls;
    } catch (error) {
      console.error("Error uploading edit package images:", error);
      throw error;
    }
  };

  const updatePackageMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      packageData: z.infer<typeof packageFormSchema>;
    }) => {
      const packageData = data.packageData;

      // First upload images and get URLs
      const uploadedImageData = await uploadEditPackageImages(
        data.id,
        packageData
      );

      // Process day-wise itinerary data into combined description
      let processedItinerary = packageData.itineraryDescription || "";
      if (
        packageData.dayWiseItinerary &&
        packageData.dayWiseItinerary.length > 0
      ) {
        const itineraryTexts = packageData.dayWiseItinerary.map((day) => {
          const imageCount = day.itineraryImages
            ? day.itineraryImages.length
            : 0;
          const imageInfo = imageCount > 0 ? ` (${imageCount} images)` : "";
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? " - " + day.itineraryDescription : ""}`;
        });
        processedItinerary = itineraryTexts.join("\n");
      }

      // Use uploaded image URLs or preserve existing ones
      const packageImage = uploadedImageData.packageStayingImage || "";
      const itineraryImageNames = uploadedImageData.itineraryImages || "";
      const processedDayWiseItinerary =
        uploadedImageData.dayWiseItinerary || [];

      const processedData = {
        tenantId: tenant?.id,
        packageTypeId: packageData.packageTypeId || 1,
        name: packageData.name,
        description:
          packageData.description || processedItinerary || "Travel package",
        destination:
          `${getRegionLabel(packageData.region)}${packageData.country ? ", " + packageData.country : ""}${packageData.city ? ", " + packageData.city : ""}` ||
          "To be determined",
        duration: packageData.selectedDuration || 1,
        price: parseFloat(packageData.price) || 0,
        maxCapacity: packageData.noOfPax,
        inclusions: packageData.packageIncludes || "",
        exclusions: packageData.packageExcludes || "",
        isActive: packageData.isActive !== false,
        durationType: packageData.durationType,
        region: packageData.region,
        country: packageData.country,
        city: packageData.city,
        packageStayingImage: packageImage,
        altName: packageData.altName,
        vendorName: packageData.vendorName,
        rating: packageData.rating,
        status: packageData.status,
        itineraryImages: itineraryImageNames,
        itineraryDescription: packageData.itineraryDescription,
        cancellationPolicy: packageData.cancellationPolicy,
        cancellationBenefit: packageData.cancellationBenefit,
        dayWiseItinerary: processedDayWiseItinerary,
        itinerary: processedItinerary,
        image: packageImage,
      };

      console.log(
        "Updating package with processed data (images uploaded):",
        processedData
      );
      return apiRequest(
        "PUT",
        `/api/tenants/${tenant?.id}/packages/${data.id}`,
        processedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      toast({
        title: "Success",
        description:
          "Travel package updated successfully with images uploaded!",
      });

      // Reset image selection states after successful update
      setSelectedPackageImage(null);
      setSelectedItineraryImages([]);
      setUploadedPackageImage("");
      setUploadedItineraryImages([]);
      setDayWiseData([]);
    },
    onError: (error: any) => {
      console.error("Update package error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update travel package",
        variant: "destructive",
      });
    },
  });

  // Image upload functions (called after package creation)
  const uploadImageToServer = async (file: File): Promise<string> => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();

      if (!data.uploadURL) {
        throw new Error("No upload URL received from server");
      }

      // Upload the file to the presigned URL
      const uploadResponse = await fetch(data.uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Use the stable public URL for storage, not the temporary upload URL
      return data.publicUrl || data.uploadURL; // Return stable public URL for storage
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const uploadPackageImages = async (packageId: number) => {
    const imageUrls: any = {};

    try {
      // Upload package staying image
      if (selectedPackageImage) {
        console.log("Uploading package image...");
        imageUrls.packageStayingImage =
          await uploadImageToServer(selectedPackageImage);
      }

      // Upload general itinerary images
      if (selectedItineraryImages.length > 0) {
        console.log("Uploading itinerary images...");
        const itineraryUrls = await Promise.all(
          selectedItineraryImages.map((file) => uploadImageToServer(file))
        );
        imageUrls.itineraryImages = itineraryUrls.join(", ");
      }

      // Upload day-wise images
      if (dayWiseData.length > 0) {
        console.log("Uploading day-wise images...");
        const processedDayWiseItinerary = await Promise.all(
          dayWiseData.map(async (day) => {
            let itineraryImageNames = "";
            if (day.itineraryImages.length > 0) {
              const dayImageUrls = await Promise.all(
                day.itineraryImages.map((file) => uploadImageToServer(file))
              );
              itineraryImageNames = dayImageUrls.join(", ");
            }
            return {
              day: day.day,
              place: day.place,
              itineraryDescription: day.itineraryDescription || "",
              itineraryImageNames,
            };
          })
        );
        imageUrls.dayWiseItinerary = processedDayWiseItinerary;
      }

      // Update package with uploaded image URLs
      if (Object.keys(imageUrls).length > 0) {
        console.log("Updating package with image URLs...", imageUrls);
        await apiRequest(
          "PATCH",
          `/api/tenants/${tenant?.id}/packages/${packageId}`,
          imageUrls
        );
        toast({
          title: "Success",
          description: "Package images uploaded successfully!",
        });
      }
    } catch (error) {
      console.error("Error uploading package images:", error);
      toast({
        title: "Warning",
        description:
          "Package created but some images failed to upload. You can edit the package to retry image upload.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pkg: TravelPackage) => {
    navigate(`/packages/edit/${pkg.id}`);
  };

  const handleView = (pkg: TravelPackage) => {
    navigate(`/packages/preview/${pkg.id}`);
  };

  const handleSend = (pkg: TravelPackage) => {
    setSelectedPackage(pkg);
    setSendDialogOpen(true);
  };

  const handleDelete = (pkg: TravelPackage) => {
    if (window.confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
      deletePackageMutation.mutate(pkg.id);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && pkg.isActive) ||
      (statusFilter === "inactive" && !pkg.isActive);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Travel Packages
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your tour packages and travel offerings
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              title="Import Packages"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  title="Export Packages"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPackagesPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPackagesCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPackagesExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/package-types">
              <Button
                variant="outline"
                data-testid="button-manage-package-types"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Package Types
              </Button>
            </Link>
            <Button 
              onClick={() => navigate("/packages/create")} 
              data-testid="button-add-package"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search packages by name or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    data-testid="view-toggle-table"
                  >
                    <List className="h-4 w-4 mr-1" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className="h-8 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    data-testid="view-toggle-card"
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Display - Table or Card View */}
        {filteredPackages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No travel packages found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No packages match your search criteria."
                  : "Start by creating your first travel package."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => navigate("/packages/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Package
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EEF2F6] border-b-2">
                    <tr>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Image
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Package
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Destination
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Duration
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Price
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Capacity
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Vendor
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Rating
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPackages.map((pkg) => (
                      <tr
                        key={pkg.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-6 py-4">
                          {pkg.packageStayingImage || pkg.image ? (
                            <img
                              src={pkg.packageStayingImage || pkg.image}
                              alt={pkg.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                console.error("Image failed to load:", pkg.packageStayingImage || pkg.image);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log("Image loaded successfully:", pkg.packageStayingImage || pkg.image);
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <MapPin className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <Link
                              href={`/packages/edit/${pkg.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                            >
                              {pkg.name}
                            </Link>
                            {pkg.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {pkg.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {pkg.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {pkg.duration} days
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                            ${pkg.price}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {pkg.maxCapacity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {pkg.vendorName || (
                              <span className="text-gray-400 italic">
                                No vendor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {pkg.rating ? (
                              <div className="flex items-center">
                                <span className="text-yellow-500 mr-1">⭐</span>
                                {pkg.rating}/5
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">
                                No rating
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={pkg.isActive ? "default" : "secondary"}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                pkg.isActive
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  pkg.isActive ? "bg-green-600" : "bg-red-600"
                                }`}
                              ></span>
                              {pkg.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {pkg.status && (
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {pkg.status}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-4 whitespace-nowrap text-right">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSend(pkg)}
                              title="Send Package"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(pkg)}
                              title="View Package"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(pkg)}
                              title="Edit Package"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              title="Open Public URL"
                            >
                              <a
                                href={`${window.location.origin}/public/package/${pkg.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(pkg)}
                              disabled={deletePackageMutation.isPending}
                              title="Delete Package"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className="hover:shadow-lg transition-shadow duration-200"
                data-testid={`card-package-${pkg.id}`}
              >
                <CardContent className="p-0">
                  {/* Package Image */}
                  {pkg.packageStayingImage || pkg.image ? (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={pkg.packageStayingImage || pkg.image}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Card image failed to load:", pkg.packageStayingImage || pkg.image, pkg);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log("Card image loaded:", pkg.packageStayingImage || pkg.image);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/packages/edit/${pkg.id}`}
                            className="font-semibold text-lg text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 truncate"
                          >
                            {pkg.name}
                          </Link>
                        </div>
                        {pkg.altName && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            {pkg.altName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Badge
                          variant={pkg.isActive ? "default" : "secondary"}
                          className={`text-xs ${
                            pkg.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {pkg.rating && (
                          <Badge
                            variant="outline"
                            className="text-xs text-yellow-600"
                          >
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {pkg.rating}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}

                    {/* Package Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="truncate">{pkg.destination}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        <span>{pkg.duration} days</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                        <span className="font-medium">${pkg.price}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 mr-2 text-purple-500" />
                        <span>{pkg.maxCapacity} pax</span>
                      </div>
                    </div>

                    {/* Vendor & Additional Info */}
                    {(pkg.vendorName || pkg.region) && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {pkg.vendorName && (
                          <div>
                            <span className="font-medium">Vendor:</span>{" "}
                            {pkg.vendorName}
                          </div>
                        )}
                        {pkg.region && (
                          <div>
                            <span className="font-medium">Region:</span>{" "}
                            {pkg.region}
                            {pkg.country && `, ${pkg.country}`}
                            {pkg.city && `, ${pkg.city}`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSend(pkg)}
                          title="Send Package"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(pkg)}
                          data-testid={`button-view-${pkg.id}`}
                          title="View Package"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          data-testid={`button-edit-${pkg.id}`}
                          title="Edit Package"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          title="Open Public URL"
                        >
                          <a
                            href={`${window.location.origin}/public/package/${pkg.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pkg)}
                          disabled={deletePackageMutation.isPending}
                          data-testid={`button-delete-${pkg.id}`}
                          title="Delete Package"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {pkg.status && (
                        <Badge variant="outline" className="capitalize text-xs">
                          {pkg.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Travel Packages</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import travel packages. The file should contain columns: Name, Description, Destination, Duration, Price, Capacity, Vendor, Rating, Status, etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="import-file">Select File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSampleFile}
                  className="text-xs"
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {importFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportPackages}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Send Package Dialog */}
      {selectedPackage && (
        <SendPackageDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            if (!open) {
              setSelectedPackage(null);
            }
          }}
          package={selectedPackage}
        />
      )}
    </Layout>
  );
}
