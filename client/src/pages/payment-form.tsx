import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// import { Loader2, CheckCircle2, Eye, X, Camera, Image as ImageIcon } from "lucide-react";
import { Loader2, CheckCircle2, Eye, X, Camera, Image as ImageIcon, FileText } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface ConsulationField {
  id: string;
  label: string;
  type: "title" | "text" | "price" | "textarea" | "phone" | "image" | "file";
  required?: boolean;
}

export default function PaymentForm() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [fields, setFields] = useState<ConsulationField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [formType, setFormType] = useState<string>('payment');
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string[]>>({}); // Blob URLs for uploaded files
  const [defaultImageUrls, setDefaultImageUrls] = useState<Record<string, string[]>>({}); // URLs for default images
  const [fileFiles, setFileFiles] = useState<Record<string, File[]>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string[]>>({}); // Blob URLs for uploaded files
  const [defaultFileUrls, setDefaultFileUrls] = useState<Record<string, string[]>>({}); // URLs for default files from database
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewUrlsRef = useRef<string[]>([]);
  const [fieldsWithDefaults, setFieldsWithDefaults] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileImageOptions, setShowMobileImageOptions] = useState<{ fieldId: string } | null>(null);
  const cameraInputRefs = useRef<Record<string, HTMLInputElement>>({});
  const galleryInputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Get tenantId, customerId, and formType from URL query params
    const params = new URLSearchParams(window.location.search);
    const tenantIdParam = params.get("tenantId");
    const customerIdParam = params.get("customerId");
    const formTypeParam = params.get("formType") || 'payment';

    if (tenantIdParam) {
      setTenantId(parseInt(tenantIdParam));
    }
    if (customerIdParam) {
      setCustomerId(parseInt(customerIdParam));
    }
    setFormType(formTypeParam);

    // Load form fields if tenantId is available
    if (tenantIdParam) {
      loadFormFields(parseInt(tenantIdParam), formTypeParam);
    } else {
      setIsLoading(false);
      toast({
        title: "Invalid form link",
        description: "This form link is invalid. Please contact support.",
        variant: "destructive",
      });
    }
  }, []);

  const loadFormFields = async (tenantId: number, formType: string = 'payment') => {
    console.log("🔍 loadFormFields called with tenantId:", tenantId, "formType:", formType);
    try {
      setIsLoading(true);
      // Try to get form fields from API first
      try {
        console.log("🔍 Making API request to:", `/api/tenants/${tenantId}/consulation-form?formType=${formType}`);
        const response = await apiRequest(
          "GET",
          `/api/tenants/${tenantId}/consulation-form?formType=${formType}`,
          {}
        );
        console.log("🔍 API response received, status:", response.status);
        const data = await response.json();
        console.log("🔍 API response data parsed:", data);
        
        console.log("📋 Form fields response from API:", {
          success: data?.success,
          hasFields: !!data?.fields,
          fieldsType: typeof data?.fields,
          isArray: Array.isArray(data?.fields),
          fieldsLength: Array.isArray(data?.fields) ? data.fields.length : 'N/A',
          fieldsValue: data?.fields,
        });
        
        // Handle fields - might be a string that needs parsing
        let fieldsToUse = data?.fields;
        
        // If fields is a string, parse it
        if (fieldsToUse && typeof fieldsToUse === 'string') {
          try {
            fieldsToUse = JSON.parse(fieldsToUse);
            console.log("✅ Parsed fields string on client side:", fieldsToUse);
          } catch (parseError) {
            console.error("❌ Failed to parse fields string:", parseError);
            fieldsToUse = null;
          }
        }
        
        if (fieldsToUse && Array.isArray(fieldsToUse) && fieldsToUse.length > 0) {
          // Use fields from database
          console.log("✅ Setting fields:", fieldsToUse);
          setFields(fieldsToUse);
          
          // Load default values from API response
          const defaultValues = data?.defaultValues || {};
          console.log("📋 Loaded default values from API:", defaultValues);
          
          // Initialize form values with default values
          const initialValues: Record<string, string> = {};
          const initialImageUrls: Record<string, string[]> = {};
          const initialFileUrls: Record<string, string[]> = {};
          
          fieldsToUse.forEach((field: ConsulationField) => {
            const defaultValue = defaultValues[field.id] || "";
            if (field.type === "image" && defaultValue) {
              // For image fields, parse comma-separated URLs
              const urls = defaultValue.split(",")
                .map((url: string) => url.trim())
                .filter((url: string) => url && url.length > 0);
              initialImageUrls[field.id] = urls;
              // Set display value as image names
              const imageNames = urls.map((url: string, index: number) => {
                const urlParts = url.split("/");
                const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
                return `Image ${index + 1}: ${filename}`;
              }).join(", ");
              initialValues[field.id] = imageNames;
            } else if (field.type === "file" && defaultValue) {
              // For file fields, parse comma-separated URLs
              const urls = defaultValue.split(",")
                .map((url: string) => url.trim())
                .filter((url: string) => url && url.length > 0);
              initialFileUrls[field.id] = urls;
              // Set display value as file names
              const fileNames = urls.map((url: string, index: number) => {
                const urlParts = url.split("/");
                const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
                const isPdf = filename.toLowerCase().endsWith('.pdf');
                return `${isPdf ? 'PDF' : 'Image'} ${index + 1}: ${filename}`;
              }).join(", ");
              initialValues[field.id] = fileNames;
            } else if (defaultValue) {
              // For other fields, use the default value directly
              initialValues[field.id] = defaultValue;
            } else {
              initialValues[field.id] = "";
            }
          });
          
          setFormValues(initialValues);
          // Store default image URLs separately (not blob URLs)
          setDefaultImageUrls((prev) => {
            const next = { ...prev };
            Object.keys(initialImageUrls).forEach((fieldId) => {
              next[fieldId] = initialImageUrls[fieldId];
            });
            return next;
          });
          // Store default file URLs separately
          setDefaultFileUrls((prev) => {
            const next = { ...prev };
            Object.keys(initialFileUrls).forEach((fieldId) => {
              next[fieldId] = initialFileUrls[fieldId];
            });
            return next;
          });
          // Track which fields have default values
          const fieldsWithDefaultsSet = new Set<string>();
          Object.keys(initialValues).forEach((fieldId) => {
            if (initialValues[fieldId]) {
              fieldsWithDefaultsSet.add(fieldId);
            }
          });
          setFieldsWithDefaults(fieldsWithDefaultsSet);
        } else {
          // No fields configured - show empty form with message
          console.log("⚠️ No fields found or empty array. fieldsToUse:", fieldsToUse);
          setFields([]);
          setFormValues({});
        }
      } catch (error) {
        // If API fails, show empty form
        console.warn("Failed to load form fields from API:", error);
        setFields([]);
        setFormValues({});
      }
    } catch (error: any) {
      console.error("Error loading form fields:", error);
      toast({
        title: "Error loading form",
        description: error?.message || "Failed to load payment form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultFields = (): ConsulationField[] => {
    return [
      {
        id: "consulation-title",
        label: "Consulation Title",
        type: "title",
        required: true,
      },
      {
        id: "consulation-price",
        label: "Consulation Price",
        type: "price",
      },
      {
        id: "consulation-phone",
        label: "Phone Number",
        type: "phone",
      },
      {
        id: "consulation-description",
        label: "Additional Notes",
        type: "textarea",
      },
    ];
  };

  const handleValueChange = (fieldId: string, value: string) => {
    // Don't allow changes to fields with default values
    if (fieldsWithDefaults.has(fieldId)) {
      return;
    }
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleImageChange = (fieldId: string, files: FileList | null) => {
    // Don't allow changes to fields with default values
    if (fieldsWithDefaults.has(fieldId)) {
      return;
    }
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newFiles = [...(imageFiles[fieldId] || []), ...fileArray];
    setImageFiles((prev) => ({ ...prev, [fieldId]: newFiles }));

    // Create preview URLs
    const newPreviews = fileArray.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      return previewUrl;
    });
    setImagePreviews((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPreviews],
    }));

    // Update form value to show image names
    const imageNames = newFiles.map((file, index) => `Image ${index + 1} ${file.name}`).join(", ");
    setFormValues((prev) => ({ ...prev, [fieldId]: imageNames }));
    
    // Close mobile options dialog after selection
    if (showMobileImageOptions?.fieldId === fieldId) {
      setShowMobileImageOptions(null);
    }
  };

  const handleMobileImageOption = (fieldId: string, option: 'camera' | 'gallery') => {
    if (option === 'camera') {
      cameraInputRefs.current[fieldId]?.click();
    } else {
      galleryInputRefs.current[fieldId]?.click();
    }
  };

  const removeImage = (fieldId: string, index: number) => {
    const currentFiles = imageFiles[fieldId] || [];
    const currentPreviews = imagePreviews[fieldId] || [];

    // Revoke preview URL
    if (currentPreviews[index]) {
      URL.revokeObjectURL(currentPreviews[index]);
      previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== currentPreviews[index]);
    }

    const newFiles = currentFiles.filter((_, i) => i !== index);
    const newPreviews = currentPreviews.filter((_, i) => i !== index);

    setImageFiles((prev) => ({ ...prev, [fieldId]: newFiles }));
    setImagePreviews((prev) => ({ ...prev, [fieldId]: newPreviews }));

    // Update form value
    const imageNames = newFiles.map((file, idx) => `Image ${idx + 1} ${file.name}`).join(", ");
    setFormValues((prev) => ({ ...prev, [fieldId]: imageNames || "" }));
  };

  const handleFileChange = (fieldId: string, files: FileList | null) => {
    // Don't allow changes to fields with default values
    if (fieldsWithDefaults.has(fieldId)) {
      return;
    }
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newFiles = [...(fileFiles[fieldId] || []), ...fileArray];
    setFileFiles((prev) => ({ ...prev, [fieldId]: newFiles }));

    // Create preview URLs for images only (PDFs will use empty string)
    const newPreviews = fileArray.map((file) => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
        return previewUrl;
      } else {
        return '';
      }
    });
    setFilePreviews((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPreviews],
    }));

    // Update form value to show file names
    const fileNames = newFiles.map((file, index) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      return `${isPdf ? 'PDF' : 'Image'} ${index + 1} ${file.name}`;
    }).join(", ");
    setFormValues((prev) => ({ ...prev, [fieldId]: fileNames }));
  };

  const removeFile = (fieldId: string, index: number) => {
    const currentFiles = fileFiles[fieldId] || [];
    const currentPreviews = filePreviews[fieldId] || [];

    // Revoke preview URL if it exists
    if (currentPreviews[index]) {
      URL.revokeObjectURL(currentPreviews[index]);
      previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== currentPreviews[index]);
    }

    const newFiles = currentFiles.filter((_, i) => i !== index);
    const newPreviews = currentPreviews.filter((_, i) => i !== index);

    setFileFiles((prev) => ({ ...prev, [fieldId]: newFiles }));
    setFilePreviews((prev) => ({ ...prev, [fieldId]: newPreviews }));

    // Update form value
    const fileNames = newFiles.map((file, idx) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      return `${isPdf ? 'PDF' : 'Image'} ${idx + 1} ${file.name}`;
    }).join(", ");
    setFormValues((prev) => ({ ...prev, [fieldId]: fileNames || "" }));
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const validateForm = (): boolean => {
    for (const field of fields) {
      if (field.required) {
        if (field.type === "image") {
          // For image fields, check if files are selected (only if no default values)
          if (!fieldsWithDefaults.has(field.id) && (!imageFiles[field.id] || imageFiles[field.id].length === 0)) {
            toast({
              title: "Validation Error",
              description: `${field.label} is required. Please select at least one image.`,
              variant: "destructive",
            });
            return false;
          }
        } else if (field.type === "file") {
          // For file fields, check if files are selected (only if no default values)
          if (!fieldsWithDefaults.has(field.id) && (!fileFiles[field.id] || fileFiles[field.id].length === 0)) {
            toast({
              title: "Validation Error",
              description: `${field.label} is required. Please select at least one file.`,
              variant: "destructive",
            });
            return false;
          }
        } else if (!formValues[field.id]?.trim()) {
          toast({
            title: "Validation Error",
            description: `${field.label} is required.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!tenantId || !customerId) {
      toast({
        title: "Error",
        description: "Missing tenant or customer information.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload images and files first
      const uploadedImageUrls: Record<string, string[]> = {};
      const uploadedFileUrls: Record<string, string[]> = {};
      for (const field of fields) {
        if (field.type === "image" && imageFiles[field.id] && imageFiles[field.id].length > 0) {
          try {
            const formData = new FormData();
            imageFiles[field.id].forEach((file) => {
              formData.append('attachments', file);
            });

            const uploadResponse = await fetch('/api/consulation-form/upload-images', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({ message: 'Failed to upload files' }));
              throw new Error(errorData.message || 'Failed to upload files');
            }

            const uploadResult = await uploadResponse.json();
            const uploadedFiles = uploadResult.files || [];
            uploadedImageUrls[field.id] = uploadedFiles
              .filter((f: any) => f.path)
              .map((f: any) => f.path);
          } catch (error: any) {
            console.error(`Error uploading images for field ${field.id}:`, error);
            toast({
              title: "Upload Error",
              description: `Failed to upload images for ${field.label}: ${error.message}`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Prepare responses with image URLs
      // Include default image URLs for fields with defaults
      const responses: Record<string, string> = { ...formValues };
      for (const field of fields) {
        if (field.type === "image") {
          // Use defaultImageUrls for default images (not imagePreviews which is for blob URLs)
          const defaultUrls = fieldsWithDefaults.has(field.id) ? (defaultImageUrls[field.id] || []) : [];
          const newUrls = uploadedImageUrls[field.id] || [];
          const allUrls = [...defaultUrls, ...newUrls].filter((url, index, self) => self.indexOf(url) === index);
          if (allUrls.length > 0) {
            responses[field.id] = allUrls.join(", ");
          }
        }
      }

      const response = await apiRequest(
        "POST",
        `/api/tenants/${tenantId}/customers/${customerId}/consulation-form/submit`,
        {
          fields: fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
          })),
          responses: responses,
          formType: formType,
        }
      );

      const data = await response.json();
      if (data?.success) {
        setIsSubmitted(true);
        toast({
          title: "Form submitted successfully",
          description: "Thank you for completing the payment form!",
        });
      } else {
        throw new Error(data?.message || "Failed to submit form");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission failed",
        description: error?.message || "Failed to submit the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: ConsulationField) => {
    const hasDefault = fieldsWithDefaults.has(field.id);
    const commonProps = {
      id: field.id,
      value: formValues[field.id] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleValueChange(field.id, e.target.value),
      required: field.required,
      className: hasDefault ? "w-full bg-gray-50 cursor-not-allowed" : "w-full",
      disabled: hasDefault,
      readOnly: hasDefault,
    };

    switch (field.type) {
      case "title":
        return <Input placeholder="Enter title" {...commonProps} />;
      case "price":
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...commonProps}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder="Enter details"
            value={formValues[field.id] || ""}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className={hasDefault ? "min-h-[100px] w-full bg-gray-50 cursor-not-allowed" : "min-h-[100px] w-full"}
            required={field.required}
            disabled={hasDefault}
            readOnly={hasDefault}
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...commonProps}
          />
        );
      case "image":
        const fieldImages = imageFiles[field.id] || [];
        const fieldBlobPreviews = imagePreviews[field.id] || []; // Blob URLs for uploaded files
        const fieldDefaultUrls = defaultImageUrls[field.id] || []; // URLs for default images
        
        if (hasDefault && fieldDefaultUrls.length > 0) {
          // Show only clickable default images
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {fieldDefaultUrls.map((url: string, index: number) => {
                  const urlParts = url.split("/");
                  const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
                  const normalizedUrl =
                    url.startsWith("http") || url.startsWith("https")
                      ? url
                      : url.startsWith("/")
                      ? url
                      : `/${url}`;
        
                  return (
                    <div
                      key={`default-${field.id}-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: normalizedUrl, name: filename })}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Image {index + 1}:{" "}
                        {filename.length > 30 ? filename.substring(0, 30) + "..." : filename}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        
        
        // No default value - allow uploads
        return (
          <div className="space-y-3">
            {isMobile ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMobileImageOptions({ fieldId: field.id })}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                {/* Hidden file inputs for mobile */}
                <input
                  ref={(el) => {
                    if (el) cameraInputRefs.current[field.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageChange(field.id, e.target.files)}
                  className="hidden"
                />
                <input
                  ref={(el) => {
                    if (el) galleryInputRefs.current[field.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageChange(field.id, e.target.files)}
                  className="hidden"
                />
              </>
            ) : (
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageChange(field.id, e.target.files)}
                className="w-full"
              />
            )}
            <p className="text-xs text-gray-500">
              {isMobile ? "Tap to choose from camera or gallery" : "You can select multiple images"}
            </p>
            {fieldImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">
                  Selected Images ({fieldImages.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {fieldImages.map((file, index) => (
                    <div
                      key={`${field.id}-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const previewUrl = fieldBlobPreviews[index];
                          if (previewUrl) {
                            // Blob URLs don't need normalization
                            setViewingImage({ url: previewUrl, name: file.name });
                          } else {
                            console.error("No preview URL found for image:", file.name, "at index:", index);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Image {index + 1}: {file.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(field.id, index)}
                        className="text-red-500 hover:text-red-700 ml-1"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "file":
        const fieldFiles = fileFiles[field.id] || [];
        const fieldFilePreviews = filePreviews[field.id] || [];
        const fieldDefaultFileUrls = defaultFileUrls[field.id] || [];
        const hasFileDefault = fieldsWithDefaults.has(field.id) && fieldDefaultFileUrls.length > 0;
        
        if (hasFileDefault && fieldDefaultFileUrls.length > 0) {
          // Show only clickable default files
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {fieldDefaultFileUrls.map((url: string, index: number) => {
                  const urlParts = url.split("/");
                  const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
                  const isPdf = filename.toLowerCase().endsWith('.pdf');
                  const normalizedUrl =
                    url.startsWith("http") || url.startsWith("https")
                      ? url
                      : url.startsWith("/")
                      ? url
                      : `/${url}`;
          
                  return (
                    <div
                      key={`default-file-${field.id}-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: normalizedUrl, name: filename })}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {isPdf ? 'PDF' : 'Image'} {index + 1}:{" "}
                        {filename.length > 30 ? filename.substring(0, 30) + "..." : filename}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        
        // No default value - allow uploads
        return (
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => handleFileChange(field.id, e.target.files)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              You can select multiple images and PDFs
            </p>
            {fieldFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">
                  Selected Files ({fieldFiles.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {fieldFiles.map((file, index) => {
                    const isPdf = file.name.toLowerCase().endsWith('.pdf');
                    const previewUrl = fieldFilePreviews[index];
                    return (
                      <div
                        key={`${field.id}-${index}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (previewUrl) {
                              setViewingImage({ url: previewUrl, name: file.name });
                            } else if (isPdf) {
                              // For PDFs, we'll open in a new tab or use an iframe
                              setViewingImage({ url: URL.createObjectURL(file), name: file.name });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {isPdf ? 'PDF' : 'Image'} {index + 1}: {file.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(field.id, index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <Input placeholder="Enter value" {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your payment form has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            We will review your submission and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            Payment Form
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Please fill out the form below to help us process your payment.
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">
                  No form fields have been configured yet.
                </p>
                <p className="text-xs text-gray-400">
                  Please contact support or wait for the form to be set up.
                </p>
              </div>
            ) : (
              fields.map((field) => (
<div
  key={field.id}
  className={`space-y-2 ${
    ["title", "price"].includes(field.type) ? "" : "md:col-span-2"
  }`}
>
                  <label
                    htmlFor={field.id}
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-red-500">*</span>
                    )}
                   
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))
            )}

            <div className="pt-4 md:col-span-2 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex-1"
                disabled={fields.length === 0}
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || fields.length === 0}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Form"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              Review your form before submitting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {fields.map((field) => {
              const value = formValues[field.id] || "";
              const fieldImages = imageFiles[field.id] || [];
              const fieldBlobPreviews = imagePreviews[field.id] || []; // Blob URLs for uploaded files
              const fieldDefaultUrls = defaultImageUrls[field.id] || []; // URLs for default images

              return (
  <Card key={field.id}>
    <CardContent className="p-4">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === "image" ? (
        <div className="space-y-2">
          {(fieldImages.length > 0 || (fieldDefaultUrls && fieldDefaultUrls.length > 0)) ? (
            <div className="flex flex-wrap gap-2">

              {/* Default images preview */}
              {fieldDefaultUrls && fieldDefaultUrls.length > 0 &&
                fieldDefaultUrls.map((url: string, index: number) => {
                  const urlParts = url.split("/");
                  const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
                  const normalizedUrl =
                    url.startsWith("http") || url.startsWith("https")
                      ? url
                      : url.startsWith("/")
                        ? url
                        : `/${url}`;

                  return (
                    <div
                      key={`preview-default-${field.id}-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={() => setViewingImage({ url: normalizedUrl, name: filename })}
                      >
                        Image {index + 1}: {filename.length > 30 ? filename.substring(0, 30) + "..." : filename}
                      </button>
                    </div>
                  );
                })}

              {/* Uploaded images preview */}
              {fieldImages.length > 0 &&
                fieldImages.map((file, index) => {
                  const previewUrl = fieldBlobPreviews[index];
                  return (
                    <div
                      key={`preview-upload-${field.id}-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={() => {
                          if (previewUrl) {
                            // Blob URLs don't need normalization
                            setViewingImage({ url: previewUrl, name: file.name });
                          } else {
                            console.error("No preview URL found for image:", file.name, "at index:", index);
                          }
                        }}
                      >
                        Image {fieldDefaultUrls.length + index + 1}: {file.name}
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No images selected</p>
          )}
        </div>
      ) : field.type === "textarea" ? (
        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
          {value || <span className="text-gray-400 italic">Not filled</span>}
        </p>
      ) : (
        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
          {value || <span className="text-gray-400 italic">Not filled</span>}
        </p>
      )}
    </CardContent>
  </Card>
);
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Image Options Dialog */}
      <Dialog open={!!showMobileImageOptions} onOpenChange={() => setShowMobileImageOptions(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Image Source</DialogTitle>
            <DialogDescription>
              Select how you want to add images
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMobileImageOption(showMobileImageOptions!.fieldId, 'camera')}
              className="w-full justify-start h-auto py-4"
            >
              <Camera className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Take Picture</div>
                <div className="text-xs text-gray-500">Use camera to capture a photo</div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMobileImageOption(showMobileImageOptions!.fieldId, 'gallery')}
              className="w-full justify-start h-auto py-4"
            >
              <ImageIcon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Choose from Gallery</div>
                <div className="text-xs text-gray-500">Select one or multiple images</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewing Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingImage?.name || "File Preview"}</DialogTitle>
          </DialogHeader>
          {viewingImage && (() => {
            const isPdf = viewingImage.name.toLowerCase().endsWith('.pdf') || 
                         viewingImage.url.toLowerCase().endsWith('.pdf') ||
                         viewingImage.url.toLowerCase().includes('.pdf');
            const normalizedUrl = viewingImage.url.startsWith('blob:')
              ? viewingImage.url
              : viewingImage.url.startsWith('http') || viewingImage.url.startsWith('https')
                ? viewingImage.url
                : viewingImage.url.startsWith('/')
                  ? viewingImage.url
                  : `/${viewingImage.url}`;
            
            return (
              <div className="flex items-center justify-center p-4">
                {isPdf ? (
                  <div className="w-full h-[70vh] flex flex-col items-center justify-center">
                    <iframe
                      src={normalizedUrl}
                      className="w-full h-full border rounded-md"
                      title={viewingImage.name}
                      onError={() => {
                        console.error("PDF load error:", normalizedUrl);
                      }}
                    />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (normalizedUrl.startsWith('blob:')) {
                            const link = document.createElement('a');
                            link.href = normalizedUrl;
                            link.download = viewingImage.name;
                            link.click();
                          } else {
                            window.open(normalizedUrl, '_blank');
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Open PDF in New Tab
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={normalizedUrl}
                    alt={viewingImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-md"
                    onError={(e) => {
                      console.error("Image load error:", normalizedUrl);
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                    onLoad={() => {
                      console.log("Image loaded successfully:", normalizedUrl);
                    }}
                  />
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

