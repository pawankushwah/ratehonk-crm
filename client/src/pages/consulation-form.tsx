import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ConsulationField {
  id: string;
  label: string;
  type: "title" | "text" | "price" | "textarea" | "phone" | "image";
  required?: boolean;
}

export default function ConsulationForm() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [fields, setFields] = useState<ConsulationField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);

  useEffect(() => {
    // Get tenantId and customerId from URL query params
    const params = new URLSearchParams(window.location.search);
    const tenantIdParam = params.get("tenantId");
    const customerIdParam = params.get("customerId");

    if (tenantIdParam) {
      setTenantId(parseInt(tenantIdParam));
    }
    if (customerIdParam) {
      setCustomerId(parseInt(customerIdParam));
    }

    // Load form fields if tenantId is available
    if (tenantIdParam) {
      loadFormFields(parseInt(tenantIdParam));
    } else {
      setIsLoading(false);
      toast({
        title: "Invalid form link",
        description: "This consulation form link is invalid. Please contact support.",
        variant: "destructive",
      });
    }
  }, []);

  const loadFormFields = async (tenantId: number) => {
    console.log("🔍 loadFormFields called with tenantId:", tenantId);
    try {
      setIsLoading(true);
      // Try to get form fields from API first
      try {
        console.log("🔍 Making API request to:", `/api/tenants/${tenantId}/consulation-form`);
        const response = await apiRequest(
          "GET",
          `/api/tenants/${tenantId}/consulation-form`,
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
          // Initialize form values
          const initialValues: Record<string, string> = {};
          fieldsToUse.forEach((field: ConsulationField) => {
            initialValues[field.id] = "";
          });
          setFormValues(initialValues);
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
        description: error?.message || "Failed to load consulation form. Please try again.",
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
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = (): boolean => {
    for (const field of fields) {
      if (field.required && !formValues[field.id]?.trim()) {
        toast({
          title: "Validation Error",
          description: `${field.label} is required.`,
          variant: "destructive",
        });
        return false;
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
      const response = await apiRequest(
        "POST",
        `/api/tenants/${tenantId}/customers/${customerId}/consulation-form/submit`,
        {
          fields: fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
          })),
          responses: formValues,
        }
      );

      const data = await response.json();
      if (data?.success) {
        setIsSubmitted(true);
        toast({
          title: "Form submitted successfully",
          description: "Thank you for completing the consulation form!",
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
    const commonProps = {
      id: field.id,
      value: formValues[field.id] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleValueChange(field.id, e.target.value),
      required: field.required,
      className: "w-full",
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
            className="min-h-[100px] w-full"
            required={field.required}
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
        return (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleValueChange(
                field.id,
                e.target.files?.[0]?.name ?? ""
              )
            }
            className="w-full"
          />
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
          <p className="text-gray-600">Loading consulation form...</p>
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
            Your consulation form has been submitted successfully.
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Consulation Form
          </h1>
          <p className="text-gray-600 mb-6">
            Please fill out the form below to help us prepare for your consulation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                <div key={field.id} className="space-y-2">
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

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
    </div>
  );
}

