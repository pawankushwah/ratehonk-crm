import { useEffect, useState } from "react";
import { useLocation, Redirect } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Logo from "../../assets/Logo-sidebar.svg";

export default function Activate() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const activateAccount = async () => {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setError("Activation token is missing. Please check your email link.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/activate/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSuccess(true);
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            setLocation("/login?activated=true");
          }, 2000);
        } else {
          setError(data.message || "Failed to activate account. Please try again or contact support.");
        }
      } catch (err: any) {
        console.error("Activation error:", err);
        setError("An error occurred while activating your account. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Activating your account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Account Activated!</h2>
              <p className="text-gray-600 text-center">
                Your account has been successfully activated. Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={Logo} alt="Logo" className="h-12" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Failed to activate account. Please try again or contact support."}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Go to Login Page
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

