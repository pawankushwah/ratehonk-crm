import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { TravelPackage, PackageType } from "@/lib/types";

const packageFormSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  packageTypeId: z.number().min(1, "Package type is required"),
  noOfPax: z.number().min(1, "Number of passengers is required"),
  price: z.string().min(1, "Price is required"),
  durationType: z.enum(["with", "without"], { required_error: "Duration type is required" }),
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
  itineraryImages: z.union([z.array(z.instanceof(File)), z.array(z.string()), z.array(z.union([z.instanceof(File), z.string()]))]).optional(),
  itineraryDescription: z.string().optional(),
  packageIncludes: z.string().optional(),
  packageExcludes: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  cancellationBenefit: z.string().optional(),
  // Dynamic day-by-day itinerary
  dayWiseItinerary: z.array(z.object({
    day: z.number(),
    place: z.string().min(1, "Place is required"),
    itineraryImages: z.union([z.array(z.instanceof(File)), z.array(z.string()), z.array(z.union([z.instanceof(File), z.string()]))]).optional(),
    itineraryDescription: z.string().optional(),
  })).optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Require selectedDuration when durationType is "with"
  if (data.durationType === "with" && !data.selectedDuration) {
    return false;
  }
  return true;
}, {
  message: "Duration is required when duration type is 'with'",
  path: ["selectedDuration"],
});

export default function TravelPackages() {
  const { tenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(
    null
  );
  
  // Image selection state (files selected but not uploaded yet)
  const [selectedPackageImage, setSelectedPackageImage] = useState<File | null>(null);
  const [selectedItineraryImages, setSelectedItineraryImages] = useState<File[]>([]);
  // For display of already uploaded images in edit mode
  const [uploadedPackageImage, setUploadedPackageImage] = useState<string>("");
  const [uploadedItineraryImages, setUploadedItineraryImages] = useState<string[]>([]);
  const [daysSummary, setDaysSummary] = useState<string[]>(["1 Place"]);
  const [dayWiseData, setDayWiseData] = useState<Array<{
    day: number;
    place: string;
    itineraryImages: (File | string)[]; // Support both File objects and URL strings
    itineraryDescription: string;
  }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      label: `${days} Day${days > 1 ? 's' : ''} | ${nights} Night${nights > 1 ? 's' : ''}`,
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
    const region = regionOptions.find(option => option.value === regionValue);
    return region ? region.label : regionValue; // fallback to original value if not found
  };

  // Watch for duration changes to update days summary
  const watchDurationType = form.watch("durationType");
  const watchSelectedDuration = form.watch("selectedDuration");

  // Update days summary and initialize day-wise data when duration changes
  useEffect(() => {
    if (watchDurationType === "with" && watchSelectedDuration) {
      const summaryArray = Array.from({ length: watchSelectedDuration }, (_, index) => {
        if (index === 0) return "1 Place";
        return `${index + 1} Place`;
      });
      setDaysSummary(summaryArray);
      
      const existingDayWise = form.getValues("dayWiseItinerary") || [];
      
      // Handle resizing of day-wise data during edit when duration changes
      if (existingDayWise.length !== watchSelectedDuration) {
        const resizedDayWiseArray = Array.from({ length: watchSelectedDuration }, (_, index) => {
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
        });
        
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

  const createPackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof packageFormSchema>) => {
      // Process day-wise itinerary data into combined description
      let processedItinerary = data.itineraryDescription || '';
      if (data.dayWiseItinerary && data.dayWiseItinerary.length > 0) {
        const itineraryTexts = data.dayWiseItinerary.map((day) => {
          const imageCount = day.itineraryImages ? day.itineraryImages.length : 0;
          const imageInfo = imageCount > 0 ? ` (${imageCount} images selected)` : '';
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? ' - ' + day.itineraryDescription : ''}`;
        });
        processedItinerary = itineraryTexts.join('\n');
      }

      // Process day-wise itinerary without images for initial package creation
      const processedDayWiseItinerary = data.dayWiseItinerary ? data.dayWiseItinerary.map(day => ({
        day: day.day,
        place: day.place,
        itineraryDescription: day.itineraryDescription || '',
        itineraryImageNames: '' // Will be updated after image upload
      })) : [];

      // Create payload WITHOUT images initially (images will be uploaded after package creation)
      const processedData = {
        tenantId: tenant?.id,
        packageTypeId: data.packageTypeId || 1,
        name: data.name,
        description: data.description || processedItinerary || 'Travel package',
        destination: `${getRegionLabel(data.region)}${data.country ? ', ' + data.country : ''}${data.city ? ', ' + data.city : ''}` || 'To be determined',
        duration: data.selectedDuration || 1,
        price: parseFloat(data.price) || 0,
        maxCapacity: data.noOfPax,
        inclusions: data.packageIncludes || '',
        exclusions: data.packageExcludes || '',
        isActive: data.isActive !== false,
        // Add all fields except images
        durationType: data.durationType,
        region: data.region,
        country: data.country,
        city: data.city,
        altName: data.altName,
        vendorName: data.vendorName,
        rating: data.rating,
        status: data.status,
        itineraryDescription: data.itineraryDescription,
        cancellationPolicy: data.cancellationPolicy,
        cancellationBenefit: data.cancellationBenefit,
        dayWiseItinerary: processedDayWiseItinerary,
        itinerary: processedItinerary,
        // Image fields will be empty initially
        packageStayingImage: '',
        itineraryImages: '',
        image: '',
      };
      console.log("Creating package without images first:", processedData);
      return apiRequest(
        "POST",
        `/api/tenants/${tenant?.id}/packages`,
        processedData
      );
    },
    onSuccess: async (result: any) => {
      const createdPackage = await result.json();
      console.log("Package created successfully:", createdPackage);

      toast({
        title: "Success",
        description: "Package created successfully! Uploading images...",
      });

      // Upload images after successful package creation
      if (createdPackage.id) {
        await uploadPackageImages(createdPackage.id);
      }

      // Refresh the packages list
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/packages`],
      });
      
      setIsDialogOpen(false);
      
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
  const separateFilesAndUrls = (items: any[]): { files: File[], urls: string[] } => {
    const files: File[] = [];
    const urls: string[] = [];
    
    items.forEach(item => {
      if (isFileObject(item)) {
        files.push(item);
      } else if (typeof item === 'string' && item.trim()) {
        urls.push(item.trim());
      }
    });
    
    return { files, urls };
  };

  // Enhanced image upload function for edit with mixed content handling
  const uploadEditPackageImages = async (packageId: number, packageData: z.infer<typeof packageFormSchema>) => {
    const imageUrls: any = {};
    
    try {
      // Handle package staying image - could be File or existing URL
      if (packageData.packageStayingImage) {
        if (isFileObject(packageData.packageStayingImage)) {
          console.log("Uploading new package image...");
          imageUrls.packageStayingImage = await uploadImageToServer(packageData.packageStayingImage);
        } else if (typeof packageData.packageStayingImage === 'string') {
          // Keep existing URL
          imageUrls.packageStayingImage = packageData.packageStayingImage;
        }
      }

      // Handle general itinerary images - mixed File[] and string[]
      if (packageData.itineraryImages && Array.isArray(packageData.itineraryImages)) {
        const { files: newFiles, urls: existingUrls } = separateFilesAndUrls(packageData.itineraryImages);
        
        let allUrls = [...existingUrls];
        
        if (newFiles.length > 0) {
          console.log("Uploading new itinerary images...");
          const newUrls = await Promise.all(
            newFiles.map(file => uploadImageToServer(file))
          );
          allUrls = [...allUrls, ...newUrls];
        }
        
        imageUrls.itineraryImages = allUrls.join(', ');
      }

      // Handle day-wise images - mixed content in each day
      if (packageData.dayWiseItinerary && packageData.dayWiseItinerary.length > 0) {
        console.log("Processing day-wise images...");
        const processedDayWiseItinerary = await Promise.all(
          packageData.dayWiseItinerary.map(async (day) => {
            let allDayUrls: string[] = [];
            
            if (day.itineraryImages && Array.isArray(day.itineraryImages)) {
              const { files: newFiles, urls: existingUrls } = separateFilesAndUrls(day.itineraryImages);
              
              allDayUrls = [...existingUrls];
              
              if (newFiles.length > 0) {
                const newUrls = await Promise.all(
                  newFiles.map(file => uploadImageToServer(file))
                );
                allDayUrls = [...allDayUrls, ...newUrls];
              }
            }
            
            return {
              day: day.day,
              place: day.place,
              itineraryDescription: day.itineraryDescription || '',
              itineraryImageNames: allDayUrls.join(', ')
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
    mutationFn: async (data: { id: number; packageData: z.infer<typeof packageFormSchema> }) => {
      const packageData = data.packageData;
      
      // First upload images and get URLs
      const uploadedImageData = await uploadEditPackageImages(data.id, packageData);
      
      // Process day-wise itinerary data into combined description
      let processedItinerary = packageData.itineraryDescription || '';
      if (packageData.dayWiseItinerary && packageData.dayWiseItinerary.length > 0) {
        const itineraryTexts = packageData.dayWiseItinerary.map((day) => {
          const imageCount = day.itineraryImages ? day.itineraryImages.length : 0;
          const imageInfo = imageCount > 0 ? ` (${imageCount} images)` : '';
          return `Day ${day.day}: ${day.place}${imageInfo}${day.itineraryDescription ? ' - ' + day.itineraryDescription : ''}`;
        });
        processedItinerary = itineraryTexts.join('\n');
      }

      // Use uploaded image URLs or preserve existing ones
      const packageImage = uploadedImageData.packageStayingImage || '';
      const itineraryImageNames = uploadedImageData.itineraryImages || '';
      const processedDayWiseItinerary = uploadedImageData.dayWiseItinerary || [];

      const processedData = {
        tenantId: tenant?.id,
        packageTypeId: packageData.packageTypeId || 1,
        name: packageData.name,
        description: packageData.description || processedItinerary || 'Travel package',
        destination: `${getRegionLabel(packageData.region)}${packageData.country ? ', ' + packageData.country : ''}${packageData.city ? ', ' + packageData.city : ''}` || 'To be determined',
        duration: packageData.selectedDuration || 1,
        price: parseFloat(packageData.price) || 0,
        maxCapacity: packageData.noOfPax,
        inclusions: packageData.packageIncludes || '',
        exclusions: packageData.packageExcludes || '',
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
      
      console.log("Updating package with processed data (images uploaded):", processedData);
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
        description: "Travel package updated successfully with images uploaded!",
      });
      setIsEditDialogOpen(false);
      setSelectedPackage(null);
      
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
          'Content-Type': file.type,
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
        imageUrls.packageStayingImage = await uploadImageToServer(selectedPackageImage);
      }

      // Upload general itinerary images
      if (selectedItineraryImages.length > 0) {
        console.log("Uploading itinerary images...");
        const itineraryUrls = await Promise.all(
          selectedItineraryImages.map(file => uploadImageToServer(file))
        );
        imageUrls.itineraryImages = itineraryUrls.join(', ');
      }

      // Upload day-wise images
      if (dayWiseData.length > 0) {
        console.log("Uploading day-wise images...");
        const processedDayWiseItinerary = await Promise.all(
          dayWiseData.map(async (day) => {
            let itineraryImageNames = '';
            if (day.itineraryImages.length > 0) {
              const dayImageUrls = await Promise.all(
                day.itineraryImages.map(file => uploadImageToServer(file))
              );
              itineraryImageNames = dayImageUrls.join(', ');
            }
            return {
              day: day.day,
              place: day.place,
              itineraryDescription: day.itineraryDescription || '',
              itineraryImageNames
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
        description: "Package created but some images failed to upload. You can edit the package to retry image upload.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pkg: TravelPackage) => {
    setSelectedPackage(pkg);
    
    // Load existing images into state for display
    setUploadedPackageImage(pkg.packageStayingImage || "");
    
    // Handle existing itinerary images (could be array or comma-separated string)
    let existingItineraryImages: string[] = [];
    if (Array.isArray(pkg.itineraryImages)) {
      existingItineraryImages = pkg.itineraryImages;
    } else if (typeof pkg.itineraryImages === 'string' && pkg.itineraryImages) {
      existingItineraryImages = pkg.itineraryImages.split(',').map(img => img.trim()).filter(Boolean);
    }
    setUploadedItineraryImages(existingItineraryImages);
    
    // Handle both numeric values (new packages) and text labels (old packages)
    let regionValue = "";
    if (pkg.region) {
      // Check if pkg.region is already a numeric value (new packages)
      const isValue = regionOptions.some(region => region.value === pkg.region);
      if (isValue) {
        regionValue = pkg.region; // Already a numeric value
      } else {
        // Map text label to numeric value (old packages)
        const foundRegion = regionOptions.find(region => region.label === pkg.region);
        regionValue = foundRegion ? foundRegion.value : "";
      }
    }

    // Handle day-wise itinerary data if it exists
    let dayWiseItinerary: any[] = [];
    let durationType: "with" | "without" = "without";
    let selectedDuration: number | undefined = pkg.duration;
    
    if (pkg.dayWiseItinerary && Array.isArray(pkg.dayWiseItinerary) && pkg.dayWiseItinerary.length > 0) {
      durationType = "with";
      selectedDuration = pkg.dayWiseItinerary.length;
      
      // Process day-wise data to separate existing images from form structure
      const processedDayWiseData = pkg.dayWiseItinerary.map(day => {
        // Handle existing images - could be string (comma-separated) or array
        let existingImages: string[] = [];
        if (day.itineraryImageNames) {
          if (typeof day.itineraryImageNames === 'string') {
            existingImages = day.itineraryImageNames.split(',').map(img => img.trim()).filter(Boolean);
          } else if (Array.isArray(day.itineraryImageNames)) {
            existingImages = day.itineraryImageNames;
          }
        }
        
        return {
          day: day.day,
          place: day.place || '',
          itineraryDescription: day.itineraryDescription || '',
          itineraryImages: existingImages as (File | string)[] // Combined for form - starts with existing URLs
        };
      });
      
      // Set up form data and UI state with processed structure
      dayWiseItinerary = processedDayWiseData;
      setDayWiseData(processedDayWiseData);
      const summaryArray = processedDayWiseData.map((_, index) => `${index + 1} Place`);
      setDaysSummary(summaryArray);
    } else if ((pkg.durationType === "with" || pkg.durationType === "without")) {
      durationType = pkg.durationType;
    }

    // Populate form with existing package data
    form.reset({
      name: pkg.name || "",
      packageTypeId: pkg.packageTypeId || 0,
      noOfPax: pkg.maxCapacity || 1,
      price: pkg.price?.toString() || "",
      durationType: durationType,
      selectedDuration: selectedDuration,
      region: regionValue,
      country: pkg.country || "",
      city: pkg.city || "",
      packageStayingImage: pkg.packageStayingImage || "",
      altName: pkg.altName || "",
      description: pkg.description || "",
      vendorName: pkg.vendorName || "",
      rating: pkg.rating || undefined,
      status: pkg.status || "",
      itineraryImages: existingItineraryImages,
      itineraryDescription: pkg.itineraryDescription || "",
      packageIncludes: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(", ") : (pkg.inclusions || ""),
      packageExcludes: Array.isArray(pkg.exclusions) ? pkg.exclusions.join(", ") : (pkg.exclusions || ""),
      cancellationPolicy: pkg.cancellationPolicy || "",
      cancellationBenefit: pkg.cancellationBenefit || "",
      dayWiseItinerary: dayWiseItinerary,
      isActive: pkg.isActive !== false,
    });

    setIsEditDialogOpen(true);
  };

  // Reset upload states when dialogs open/close to prevent stale UI
  const handleCreateDialogOpen = () => {
    // Reset upload states for clean create dialog
    setUploadedPackageImage("");
    setUploadedItineraryImages([]);
    setSelectedPackageImage(null);
    setSelectedItineraryImages([]);
    setIsDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    // Reset upload states when closing edit dialog
    setUploadedPackageImage("");
    setUploadedItineraryImages([]);
    setSelectedPackageImage(null);
    setSelectedItineraryImages([]);
    setIsEditDialogOpen(false);
  };

  const handleView = (pkg: TravelPackage) => {
    setSelectedPackage(pkg);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (pkg: TravelPackage) => {
    if (window.confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
      deletePackageMutation.mutate(pkg.id);
    }
  };

  const onEditSubmit = (data: z.infer<typeof packageFormSchema>) => {
    if (selectedPackage) {
      updatePackageMutation.mutate({
        id: selectedPackage.id,
        packageData: data,
      });
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
            <Link href="/package-types">
              <Button variant="outline" data-testid="button-manage-package-types">
                <Settings className="h-4 w-4 mr-2" />
                Manage Package Types
              </Button>
            </Link>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (open) {
                  // Reset form to default values when opening add dialog
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
                  console.log(
                    "Add Package dialog opened - form reset to defaults"
                  );
                }
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-package">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Travel Package</DialogTitle>
                <DialogDescription>
                  Add a new travel package to your offerings.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Basic Package Information */}
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
                              <SelectTrigger data-testid="select-package-type">
                                <SelectValue placeholder="Select Package Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {packageTypes.map((packageType: any) => (
                                  <SelectItem key={packageType.id} value={packageType.id.toString()}>
                                    {packageType.name}
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
                            <Input
                              placeholder="European Adventure Tour"
                              {...field}
                              data-testid="input-package-name"
                            />
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
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                              data-testid="input-no-of-pax"
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
                            <Input 
                              placeholder="$2,500" 
                              {...field} 
                              data-testid="input-price"
                            />
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger data-testid="select-duration-type">
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
                                <SelectTrigger data-testid="select-choose-duration">
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger data-testid="select-region">
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
                            <Input
                              placeholder="Choose Country"
                              {...field}
                              data-testid="input-country"
                            />
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
                            <Input
                              placeholder="Choose City"
                              {...field}
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Day-wise Itinerary - Dynamic based on duration */}
                  {watchDurationType === "with" && watchSelectedDuration && (
                    <div className="border-t pt-6">
                      <FormLabel className="text-lg font-semibold mb-4 block">Day-wise Itinerary</FormLabel>
                      <div className="space-y-6">
                        {dayWiseData.map((dayData, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="text-base font-semibold mb-4 text-gray-800">Day {dayData.day}</h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                              {/* Place Field */}
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700">Place *</FormLabel>
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
                                  data-testid={`input-day-${dayData.day}-place`}
                                />
                              </div>

                              {/* Itinerary Images Selection (Multiple) */}
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700">Itinerary Images</FormLabel>
                                <div className="mt-1 space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      const updatedData = [...dayWiseData];
                                      updatedData[index].itineraryImages = [...updatedData[index].itineraryImages, ...files];
                                      setDayWiseData(updatedData);
                                      form.setValue("dayWiseItinerary", updatedData);
                                    }}
                                    className="hidden"
                                    id={`itinerary-images-${dayData.day}`}
                                    data-testid={`file-day-${dayData.day}-images`}
                                  />
                                  <label 
                                    htmlFor={`itinerary-images-${dayData.day}`}
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    Choose images for Day {dayData.day}
                                  </label>
                                  
                                  {/* Display selected files and existing images */}
                                  {dayData.itineraryImages && dayData.itineraryImages.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-500 mb-1">{dayData.itineraryImages.length} image(s) selected:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {dayData.itineraryImages.map((item, fileIndex) => {
                                          // Handle both File objects and URL strings
                                          const isFile = item instanceof File;
                                          const displayName = isFile ? item.name : `Image ${fileIndex + 1} (existing)`;
                                          const isExisting = typeof item === 'string';
                                          
                                          return (
                                            <div key={fileIndex} className={`flex items-center rounded px-2 py-1 text-xs ${
                                              isExisting ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                              <span>{displayName}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedData = [...dayWiseData];
                                                  updatedData[index].itineraryImages = updatedData[index].itineraryImages.filter((_, i) => i !== fileIndex);
                                                  setDayWiseData(updatedData);
                                                  form.setValue("dayWiseItinerary", updatedData);
                                                }}
                                                className="ml-2 text-red-500 hover:text-red-700"
                                                data-testid={`remove-day-${dayData.day}-image-${fileIndex}`}
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
                              </div>

                              {/* Itinerary Description */}
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700">Itinerary Description</FormLabel>
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
                                  data-testid={`textarea-day-${dayData.day}-description`}
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
                                data-testid="file-package-staying-image"
                              />
                              <label 
                                htmlFor="package-staying-image"
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Choose Package Image
                              </label>
                              {(selectedPackageImage || uploadedPackageImage) && (
                                <div className="ml-2 text-sm">
                                  {selectedPackageImage && (
                                    <span className="text-gray-600">{selectedPackageImage.name}</span>
                                  )}
                                  {uploadedPackageImage && !selectedPackageImage && (
                                    <span className="text-blue-600">Existing image uploaded</span>
                                  )}
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
                            <Input
                              placeholder="Alternative name..."
                              {...field}
                              data-testid="input-alt-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
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
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vendor Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vendorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Vendor name..."
                              {...field}
                              data-testid="input-vendor-name"
                            />
                          </FormControl>
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
                              data-testid="input-rating"
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger data-testid="select-status">
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
                  {/* Additional Content Fields */}
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
                              data-testid="file-itinerary-images"
                            />
                            <label 
                              htmlFor="itinerary-images"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Choose Itinerary Images (multiple)
                            </label>
                            
                            {/* Display selected files and existing images */}
                            {(selectedItineraryImages.length > 0 || uploadedItineraryImages.length > 0) && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">
                                  {selectedItineraryImages.length + uploadedItineraryImages.length} image(s) total:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {/* Show existing uploaded images */}
                                  {uploadedItineraryImages.map((url, urlIndex) => (
                                    <div key={`existing-${urlIndex}`} className="flex items-center bg-blue-100 rounded px-2 py-1 text-xs">
                                      <span className="text-blue-800">Image {urlIndex + 1} (existing)</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUrls = uploadedItineraryImages.filter((_, i) => i !== urlIndex);
                                          setUploadedItineraryImages(updatedUrls);
                                          // Update form value to combine remaining existing + new files
                                          const combinedImages = [...updatedUrls, ...selectedItineraryImages];
                                          field.onChange(combinedImages);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                        data-testid={`remove-existing-itinerary-image-${urlIndex}`}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  {/* Show newly selected files */}
                                  {selectedItineraryImages.map((file, fileIndex) => (
                                    <div key={`new-${fileIndex}`} className="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                                      <span className="text-gray-700">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedFiles = selectedItineraryImages.filter((_, i) => i !== fileIndex);
                                          setSelectedItineraryImages(updatedFiles);
                                          // Update form value to combine existing + remaining new files
                                          const combinedImages = [...uploadedItineraryImages, ...updatedFiles];
                                          field.onChange(combinedImages);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                        data-testid={`remove-new-itinerary-image-${fileIndex}`}
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
                            data-testid="textarea-itinerary-description"
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
                            data-testid="textarea-package-includes"
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
                            data-testid="textarea-package-excludes"
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
                            data-testid="textarea-cancellation-policy"
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
                            data-testid="textarea-cancellation-benefit"
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
                            onValueChange={(value) =>
                              field.onChange(value === "true")
                            }
                            value={field.value ? "true" : "false"}
                          >
                            <SelectTrigger data-testid="select-active-status">
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
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPackageMutation.isPending}
                      data-testid="button-create-package"
                    >
                      {createPackageMutation.isPending
                        ? "Creating..."
                        : "Create Package"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog> 
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
                <Button onClick={() => setIsDialogOpen(true)}>
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
                        Package
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Destination
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]" >
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {pkg.name}
                            </div>
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
                              <span className="text-gray-400 italic">No vendor</span>
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
                              <span className="text-gray-400 italic">No rating</span>
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
                              <Badge variant="outline" className="capitalize text-xs">
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
                              onClick={() => handleView(pkg)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(pkg)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(pkg)}
                              disabled={deletePackageMutation.isPending}
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
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-package-${pkg.id}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                          {pkg.name}
                        </h3>
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
                          <Badge variant="outline" className="text-xs text-yellow-600">
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
                            <span className="font-medium">Vendor:</span> {pkg.vendorName}
                          </div>
                        )}
                        {pkg.region && (
                          <div>
                            <span className="font-medium">Region:</span> {pkg.region}
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
                          onClick={() => handleView(pkg)}
                          data-testid={`button-view-${pkg.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          data-testid={`button-edit-${pkg.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pkg)}
                          disabled={deletePackageMutation.isPending}
                          data-testid={`button-delete-${pkg.id}`}
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

        {/* Edit Package Dialog - Using comprehensive form */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Travel Package</DialogTitle>
              <DialogDescription>
                Update the travel package information with all details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                {/* Package Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="European Adventure Tour"
                          {...field}
                          data-testid="input-edit-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Package Type and Alternative Name */}
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
                            <SelectTrigger data-testid="select-edit-package-type">
                              <SelectValue placeholder="Select package type" />
                            </SelectTrigger>
                            <SelectContent>
                              {packageTypes.map((packageType: any) => (
                                <SelectItem key={packageType.id} value={packageType.id.toString()}>
                                  {packageType.name}
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
                    name="altName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternative Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Short or marketing name"
                            {...field}
                            data-testid="input-edit-alt-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Destination Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Destination Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-edit-region">
                                <SelectValue placeholder="Select region" />
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
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., France"
                              {...field}
                              data-testid="input-edit-country"
                            />
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
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Paris"
                              {...field}
                              data-testid="input-edit-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Package Details */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="durationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration Type *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-edit-duration-type">
                              <SelectValue placeholder="Choose type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="with">With Day-wise Itinerary</SelectItem>
                              <SelectItem value="without">Without Day-wise Itinerary</SelectItem>
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
                              <SelectTrigger data-testid="select-edit-choose-duration">
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
                  {watchDurationType === "without" && (
                    <FormField
                      control={form.control}
                      name="selectedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Days) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="7"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                              data-testid="input-edit-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="noOfPax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Travelers *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="20"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-edit-max-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="2500"
                            {...field}
                            data-testid="input-edit-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            placeholder="4"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                            data-testid="input-edit-rating"
                          />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explore the beautiful cities of Europe..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Vendor and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Travel partner or vendor"
                            {...field}
                            data-testid="input-edit-vendor-name"
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
                        <FormLabel>Package Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger data-testid="select-edit-status">
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

                {/* Package Images */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Package Images</h3>
                  
                  <FormField
                    control={form.control}
                    name="packageStayingImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Package Image</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedPackageImage(file);
                                  setUploadedPackageImage(""); // Clear existing when new file selected
                                  field.onChange(file);
                                }
                              }}
                              className="hidden"
                              id="edit-package-staying-image"
                              data-testid="file-edit-package-staying-image"
                            />
                            <label 
                              htmlFor="edit-package-staying-image"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {selectedPackageImage ? "Replace Package Image" : (uploadedPackageImage ? "Replace Package Image" : "Choose Package Image")}
                            </label>
                            
                            {/* Show selected new file */}
                            {selectedPackageImage && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-600">New: {selectedPackageImage.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPackageImage(null);
                                    field.onChange(uploadedPackageImage || ""); // Revert to existing or empty
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid="remove-selected-package-image"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            
                            {/* Show existing uploaded image */}
                            {uploadedPackageImage && !selectedPackageImage && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-green-600">✓ Current image uploaded</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedPackageImage("");
                                    field.onChange("");
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid="remove-existing-package-image"
                                >
                                  Remove
                                </button>
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
                    name="itineraryImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Itinerary Images</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {/* Show existing uploaded images */}
                            {uploadedItineraryImages.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Current Images ({uploadedItineraryImages.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                  {uploadedItineraryImages.map((url, urlIndex) => (
                                    <div key={`existing-${urlIndex}`} className="flex items-center bg-green-50 border border-green-200 rounded px-2 py-1 text-xs">
                                      <span className="text-green-700">Image {urlIndex + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUrls = uploadedItineraryImages.filter((_, i) => i !== urlIndex);
                                          setUploadedItineraryImages(updatedUrls);
                                          // Update form with mixed content: remaining URLs + selected files
                                          const mixedContent = [...updatedUrls, ...selectedItineraryImages];
                                          field.onChange(mixedContent);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                        data-testid={`remove-existing-itinerary-image-${urlIndex}`}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* File selection for new images */}
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  const newSelectedFiles = [...selectedItineraryImages, ...files];
                                  setSelectedItineraryImages(newSelectedFiles);
                                  // Update form with mixed content: existing URLs + all selected files
                                  const mixedContent = [...uploadedItineraryImages, ...newSelectedFiles];
                                  field.onChange(mixedContent);
                                }}
                                className="hidden"
                                id="edit-itinerary-images"
                                data-testid="file-edit-itinerary-images"
                              />
                              <label 
                                htmlFor="edit-itinerary-images"
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add More Images (Total: {uploadedItineraryImages.length + selectedItineraryImages.length})
                              </label>
                            </div>
                            
                            {/* Display newly selected files */}
                            {selectedItineraryImages.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">New Files ({selectedItineraryImages.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedItineraryImages.map((file, fileIndex) => (
                                    <div key={`new-${fileIndex}`} className="flex items-center bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs">
                                      <span className="text-blue-700">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedFiles = selectedItineraryImages.filter((_, i) => i !== fileIndex);
                                          setSelectedItineraryImages(updatedFiles);
                                          // Update form with mixed content: existing URLs + remaining files
                                          const mixedContent = [...uploadedItineraryImages, ...updatedFiles];
                                          field.onChange(mixedContent);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                        data-testid={`remove-new-itinerary-image-${fileIndex}`}
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
                </div>

                {/* Itinerary and Descriptions */}
                <FormField
                  control={form.control}
                  name="itineraryDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Itinerary Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed day-by-day itinerary..."
                          {...field}
                          data-testid="textarea-edit-itinerary-description"
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
                          placeholder="Hotel accommodation, Airport transfers, Meals (comma-separated)"
                          {...field}
                          data-testid="textarea-edit-package-includes"
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
                          placeholder="Travel insurance, Personal expenses, Optional tours (comma-separated)"
                          {...field}
                          data-testid="textarea-edit-package-excludes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cancellation Policy */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cancellationPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Policy</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cancellation terms and conditions..."
                            {...field}
                            data-testid="textarea-edit-cancellation-policy"
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
                        <FormLabel>Cancellation Benefits</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Refund policies and benefits..."
                            {...field}
                            data-testid="textarea-edit-cancellation-benefit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Day-wise Itinerary - Dynamic based on duration */}
                {watchDurationType === "with" && watchSelectedDuration && (
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-lg font-semibold">Day-wise Itinerary</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDayNumber = dayWiseData.length + 1;
                          const newDay = {
                            day: newDayNumber,
                            place: "",
                            itineraryImages: [],
                            itineraryDescription: "",
                            existingImages: [],
                            newFiles: []
                          };
                          const updatedData = [...dayWiseData, newDay];
                          setDayWiseData(updatedData);
                          form.setValue("dayWiseItinerary", updatedData);
                          // Update selectedDuration to match number of days
                          form.setValue("selectedDuration", updatedData.length);
                          // Update days summary
                          const summaryArray = Array.from({ length: updatedData.length }, (_, index) => `${index + 1} Place`);
                          setDaysSummary(summaryArray);
                        }}
                        data-testid="button-add-day"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Day
                      </Button>
                    </div>
                    <div className="space-y-6">
                      {dayWiseData.map((dayData, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Day {dayData.day}</h4>
                            {dayWiseData.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updatedData = dayWiseData.filter((_, i) => i !== index);
                                  // Renumber the remaining days
                                  const renumberedData = updatedData.map((day, newIndex) => ({
                                    ...day,
                                    day: newIndex + 1
                                  }));
                                  setDayWiseData(renumberedData);
                                  form.setValue("dayWiseItinerary", renumberedData);
                                  // Update selectedDuration to match number of days
                                  form.setValue("selectedDuration", renumberedData.length);
                                  // Update days summary
                                  const summaryArray = Array.from({ length: renumberedData.length }, (_, index) => `${index + 1} Place`);
                                  setDaysSummary(summaryArray);
                                }}
                                data-testid={`button-remove-day-${dayData.day}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {/* Place Field */}
                            <div>
                              <FormLabel className="text-sm font-medium text-gray-700">Place *</FormLabel>
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
                                data-testid={`input-edit-day-${dayData.day}-place`}
                              />
                            </div>

                            {/* Itinerary Images Selection (Multiple) */}
                            <div>
                              <FormLabel className="text-sm font-medium text-gray-700">Itinerary Images</FormLabel>
                              <div className="mt-1 space-y-3">
                                {/* Show existing images (URLs) */}
                                {dayData.existingImages && dayData.existingImages.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Current Images ({dayData.existingImages.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                      {dayData.existingImages.map((url, urlIndex) => (
                                        <div key={`day-${dayData.day}-existing-${urlIndex}`} className="flex items-center bg-green-50 border border-green-200 rounded px-2 py-1 text-xs">
                                          <span className="text-green-700">Image {urlIndex + 1}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedData = [...dayWiseData];
                                              updatedData[index].existingImages = updatedData[index].existingImages.filter((_, i) => i !== urlIndex);
                                              // Update mixed content: remaining URLs + new files
                                              updatedData[index].itineraryImages = [...updatedData[index].existingImages, ...updatedData[index].newFiles];
                                              setDayWiseData(updatedData);
                                              form.setValue("dayWiseItinerary", updatedData);
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                            data-testid={`remove-day-${dayData.day}-existing-image-${urlIndex}`}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* File selection for new images */}
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      const updatedData = [...dayWiseData];
                                      const newFiles = [...(updatedData[index].newFiles || []), ...files];
                                      updatedData[index].newFiles = newFiles;
                                      // Update mixed content: existing URLs + all new files
                                      updatedData[index].itineraryImages = [...(updatedData[index].existingImages || []), ...newFiles];
                                      setDayWiseData(updatedData);
                                      form.setValue("dayWiseItinerary", updatedData);
                                    }}
                                    className="hidden"
                                    id={`edit-itinerary-images-${dayData.day}`}
                                    data-testid={`file-edit-day-${dayData.day}-images`}
                                  />
                                  <label 
                                    htmlFor={`edit-itinerary-images-${dayData.day}`}
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Images for Day {dayData.day} (Total: {(dayData.existingImages?.length || 0) + (dayData.newFiles?.length || 0)})
                                  </label>
                                </div>
                                
                                {/* Display newly selected files */}
                                {dayData.newFiles && dayData.newFiles.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">New Files ({dayData.newFiles.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                      {dayData.newFiles.map((file, fileIndex) => (
                                        <div key={`day-${dayData.day}-new-${fileIndex}`} className="flex items-center bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs">
                                          <span className="text-blue-700">{file.name}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedData = [...dayWiseData];
                                              updatedData[index].newFiles = updatedData[index].newFiles.filter((_, i) => i !== fileIndex);
                                              // Update mixed content: existing URLs + remaining files
                                              updatedData[index].itineraryImages = [...(updatedData[index].existingImages || []), ...updatedData[index].newFiles];
                                              setDayWiseData(updatedData);
                                              form.setValue("dayWiseItinerary", updatedData);
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                            data-testid={`remove-day-${dayData.day}-new-image-${fileIndex}`}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Itinerary Description */}
                            <div>
                              <FormLabel className="text-sm font-medium text-gray-700">Itinerary Description</FormLabel>
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
                                data-testid={`textarea-edit-day-${dayData.day}-description`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Status</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={field.value ? "true" : "false"}
                        >
                          <SelectTrigger data-testid="select-edit-active-status">
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
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePackageMutation.isPending}
                  >
                    {updatePackageMutation.isPending
                      ? "Updating..."
                      : "Update Package"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Package Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Complete Package Details</DialogTitle>
              <DialogDescription>
                Comprehensive information about the travel package
              </DialogDescription>
            </DialogHeader>
            {selectedPackage && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-2xl text-gray-900 dark:text-white">
                        {selectedPackage.name}
                      </h3>
                      {selectedPackage.altName && (
                        <p className="text-sm text-gray-500 italic">
                          Also known as: {selectedPackage.altName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={selectedPackage.isActive ? "default" : "secondary"}
                        className={`${
                          selectedPackage.isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {selectedPackage.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {selectedPackage.status && (
                        <Badge variant="outline" className="capitalize">
                          {selectedPackage.status}
                        </Badge>
                      )}
                      {selectedPackage.rating && (
                        <Badge variant="outline" className="text-yellow-600">
                          ⭐ {selectedPackage.rating}/5
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedPackage.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {selectedPackage.description}
                    </p>
                  )}
                </div>

                {/* Core Package Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Destination</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPackage.destination}
                    </p>
                    {selectedPackage.region && (
                      <p className="text-xs text-gray-500">Region: {selectedPackage.region}</p>
                    )}
                    {(selectedPackage.country || selectedPackage.city) && (
                      <p className="text-xs text-gray-500">
                        {selectedPackage.country}{selectedPackage.city ? `, ${selectedPackage.city}` : ''}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Duration</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPackage.duration} Days
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedPackage.duration - 1} Night{selectedPackage.duration > 2 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Price</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${selectedPackage.price}
                    </p>
                    <p className="text-xs text-gray-500">Per person</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Capacity</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPackage.maxCapacity}
                    </p>
                    <p className="text-xs text-gray-500">Max travelers</p>
                  </div>
                </div>

                {/* Vendor Information */}
                {selectedPackage.vendorName && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vendor Information</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Vendor:</span> {selectedPackage.vendorName}
                    </p>
                  </div>
                )}

                {/* Package Inclusions & Exclusions */}
                <div className="grid md:grid-cols-2 gap-6">
                  {selectedPackage.inclusions && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        Package Inclusions
                      </h4>
                      <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg">
                        {Array.isArray(selectedPackage.inclusions) ? (
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {selectedPackage.inclusions.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedPackage.inclusions}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPackage.exclusions && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        Package Exclusions
                      </h4>
                      <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                        {Array.isArray(selectedPackage.exclusions) ? (
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {selectedPackage.exclusions.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedPackage.exclusions}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Itinerary Description */}
                {selectedPackage.itineraryDescription && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Itinerary Details</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {selectedPackage.itineraryDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* Day-wise Itinerary */}
                {selectedPackage.dayWiseItinerary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Day-wise Itinerary</h4>
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {typeof selectedPackage.dayWiseItinerary === 'string' 
                          ? selectedPackage.dayWiseItinerary 
                          : JSON.stringify(selectedPackage.dayWiseItinerary, null, 2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancellation Policy */}
                {(selectedPackage.cancellationPolicy || selectedPackage.cancellationBenefit) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Cancellation Policy</h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg space-y-2">
                      {selectedPackage.cancellationPolicy && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Policy:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedPackage.cancellationPolicy}
                          </p>
                        </div>
                      )}
                      {selectedPackage.cancellationBenefit && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Benefits:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedPackage.cancellationBenefit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Destination:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPackage.destination}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPackage.duration} days
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      ${selectedPackage.price}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Max Capacity:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPackage.maxCapacity} people
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge
                      variant={
                        selectedPackage.isActive ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {selectedPackage.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                {selectedPackage.inclusions &&
                  selectedPackage.inclusions.length > 0 && (
                    <div>
                      <span className="font-medium">Inclusions:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {Array.isArray(selectedPackage.inclusions) ? (
                          selectedPackage.inclusions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))
                        ) : (
                          <li>{selectedPackage.inclusions}</li>
                        )}
                      </ul>
                    </div>
                  )}
                {selectedPackage.exclusions &&
                  selectedPackage.exclusions.length > 0 && (
                    <div>
                      <span className="font-medium">Exclusions:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {Array.isArray(selectedPackage.exclusions) ? (
                          selectedPackage.exclusions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))
                        ) : (
                          <li>{selectedPackage.exclusions}</li>
                        )}
                      </ul>
                    </div>
                  )}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEdit(selectedPackage);
                    }}
                  >
                    Edit Package
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
