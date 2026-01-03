import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PortfolioHeader } from "@/components/layout/portfolio-header";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get userId and email from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get("userId");
    const emailParam = params.get("email");

    if (userIdParam) {
      setUserId(parseInt(userIdParam));
    } else {
      // Try to get from localStorage (set during registration)
      const storedUserId = localStorage.getItem("pendingVerificationUserId");
      const storedEmail = localStorage.getItem("pendingVerificationEmail");
      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      }
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }

    if (emailParam) {
      setEmail(emailParam);
    }

    // If no userId found, redirect to register
    if (!userIdParam && !localStorage.getItem("pendingVerificationUserId")) {
      setLocation("/register");
    }
  }, [setLocation]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedOtp.length && i < 6; i++) {
        newOtp[i] = pastedOtp[i];
      }
      setOtp(newOtp);
      // Focus next empty input or last input
      const nextIndex = Math.min(pastedOtp.length, 5);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
      return;
    }

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleVerify = async () => {
    if (!userId) {
      setError("User ID is missing. Please register again.");
      return;
    }

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use fetch directly since apiRequest has a different signature
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      if (data.token) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("cached_auth_data", JSON.stringify(data));
        if (data.tenant) {
          localStorage.setItem("tenant", JSON.stringify(data.tenant));
        }

        // Clear pending verification data
        localStorage.removeItem("pendingVerificationUserId");
        localStorage.removeItem("pendingVerificationEmail");

        toast({
          title: "Email Verified!",
          description: "Your account has been successfully verified. Welcome to RateHonk CRM!",
        });

        // Redirect to dashboard
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      } else {
        setError(data.message || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const errorMessage = err.message || "Invalid OTP. Please check and try again.";
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId) {
      setError("User ID is missing. Please register again.");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email address.",
      });

      // Clear OTP inputs
      setOtp(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("otp-0");
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      const errorMessage = err.message || "Failed to resend OTP. Please try again.";
      setError(errorMessage);
      toast({
        title: "Resend Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortfolioHeader showSignUpButton={false} showSignInButton={true} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-8 lg:p-10">
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
                  <p className="text-gray-600">
                    We've sent a 6-digit verification code to
                  </p>
                  {email && (
                    <p className="text-gray-900 font-semibold">{email}</p>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* OTP Input */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-700 text-center block">
                    Enter Verification Code
                  </Label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-blue-500 focus:ring-blue-500"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerify}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                </div>

                {/* Back to Register */}
                <div className="pt-4 border-t border-gray-200">
                  <Link href="/register">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Registration
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

