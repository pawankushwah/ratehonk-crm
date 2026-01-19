import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Hook to get the default currency from tenant settings
 * Returns the default currency or "USD" as fallback
 */
export function useDefaultCurrency(): string {
  const { tenant } = useAuth();

  const { data: invoiceSettings } = useQuery({
    queryKey: ["/api/invoice-settings", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/invoice-settings/${tenant?.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          return null;
        }
        const result = await response.json();
        return result.data || result;
      } catch (error) {
        console.error("Error fetching invoice settings:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return invoiceSettings?.defaultCurrency || "USD";
}
