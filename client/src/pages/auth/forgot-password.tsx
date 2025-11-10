import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import Logo from "../../assets/Logo-sidebar.svg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img
                  src={Logo}
                  alt="RateHonk Logo"
                  className="w-auto h-20 object-contain"
                />
              </div>
              <p className="text-gray-500 text-sm mb-8">Marketing / SEO / Web Development</p>
              
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600">You'll get an email to reset your password</p>
              </div>
            </div>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Harshvani09@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg bg-gray-50"
                  />
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending Recovery Mail...</span>
                    </div>
                  ) : (
                    "Send Recovery Mail"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox 📧</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Password recovery link has been sent from</p>
                    <p className="font-medium">notify@mailoptimal.com</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  If the email does not arrive soon, Check your spam folder.
                </p>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 font-medium">Jump to</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-2"
                      onClick={() => window.open('https://gmail.com', '_blank')}
                    >
                      <span className="text-red-500">📧</span>
                      <span>Gmail</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-2"
                      onClick={() => window.open('https://outlook.com', '_blank')}
                    >
                      <span className="text-blue-500">📧</span>
                      <span>Outlook</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link href="/login">
                <Button variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg">
                  Back to Log In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}