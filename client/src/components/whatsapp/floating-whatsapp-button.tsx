import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { FaWhatsapp } from "react-icons/fa";

export function FloatingWhatsAppButton() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  
  // Don't show button if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleWhatsAppClick = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/whatsapp/check-integration", {
        headers,
        credentials: "include",
      });
      const data = await response.json();

      if (!data.hasIntegration) {
        toast({
          title: "WhatsApp Not Configured",
          description: "Setting up WhatsApp integration...",
        });
        setLocation("/whatsapp-setup");
        return;
      }

      // Open WhatsApp in iframe within our panel (/whatsapp page)
      setLocation("/whatsapp");
    } catch (error) {
      console.error("Error checking WhatsApp integration:", error);
      toast({
        title: "Error",
        description: "Failed to check WhatsApp integration status",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      disabled={isChecking}
      className="fixed bottom-52 right-6 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white z-50 transition-all duration-200 hover:scale-110 disabled:opacity-50"
      data-testid="button-floating-whatsapp"
      title="Open WhatsApp Live Chat"
    >
      <FaWhatsapp className="h-6 w-6" />
    </Button>
  );
}
