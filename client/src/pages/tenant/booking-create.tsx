import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { TravelBookingForm } from "@/components/booking/travel-booking-form";
import { auth } from "@/lib/auth";

export default function BookingCreate() {
  const [, setLocation] = useLocation();
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      console.log("🚀 Creating booking with comprehensive approach:", data);

      // Generate unique booking number
      const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Prepare clean booking data
      const bookingData = {
        tenantId: tenant?.id,
        customerId: parseInt(data.customerId),
        leadTypeId: parseInt(data.leadTypeId),
        bookingNumber,
        status: data.status || "pending",
        travelers: parseInt(data.travelers) || 1,
        travelDate: data.travelDate,
        totalAmount: parseFloat(data.totalAmount) || 0,
        amountPaid: parseFloat(data.amountPaid) || 0,
        paymentStatus: data.paymentStatus || "pending",
        specialRequests: data.specialRequests || null,
        leadId: data.leadId ? parseInt(data.leadId) : null,
        packageId: data.packageId ? parseInt(data.packageId) : null,
        lineItems: data.lineItems || [],
      };

      console.log("🚀 Attempting booking creation with data:", bookingData);

      // Use REST API endpoint
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Booking creation failed:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to create booking: ${response.status} - ${errorText.substring(0, 200)}`,
        );
      }

      const result = await response.json();
      console.log("✅ Booking creation successful:", result);

      // Return the booking data from the API response
      return result.booking || result;
    },
    onSuccess: (result) => {
      console.log("✅ Booking creation successful:", result);
      toast({
        title: "Booking Created Successfully",
        description: `New booking ${result.booking_number || result.bookingNumber || "created"} has been added to your system.`,
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
      });
      
      setLocation("/bookings");
    },
    onError: (error: any) => {
      console.error("❌ Booking creation error:", error);
      const errorMessage =
        error.message ||
        "Failed to create booking. Please check your data and try again.";

      // Extract meaningful error from HTML response if present
      let displayMessage = errorMessage;
      if (errorMessage.includes("<!DOCTYPE")) {
        displayMessage =
          "Failed to create booking. Please check your data and try again.";
      } else if (errorMessage.includes("Failed to create booking")) {
        const parts = errorMessage.split(" - ");
        displayMessage = parts.length > 1 ? parts[1] : errorMessage;
      }

      toast({
        title: "Booking Creation Failed",
        description: displayMessage,
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (formData: any) => {
    console.log("📝 Form submitted with data:", formData);
    createBookingMutation.mutate(formData);
  };

  const onCancel = () => {
    setLocation("/bookings");
  };

  return (
    <Layout>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="mb-2"
            data-testid="button-back-to-bookings"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>

          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Create New Travel Booking
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg">
          <TravelBookingForm
            tenantId={tenant?.id?.toString() || ""}
            onSubmit={handleFormSubmit}
            onCancel={onCancel}
            isLoading={createBookingMutation.isPending}
          />
        </div>
      </div>
    </Layout>
  );
}
