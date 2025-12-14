import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { WelcomeScreen } from "@/components/ui/welcome-screen";
import { PortfolioHeader } from "@/components/layout/portfolio-header";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  // Check for URL parameters (success messages from registration, password reset)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const message = urlParams.get("message");

    if (success === "registered") {
      setSuccessMessage(
        "Account created successfully! Please sign in with your new credentials.",
      );
      toast({
        title: "Registration Successful!",
        description:
          "Welcome to TravelCRM Pro! Your 7-day free trial has started.",
      });
    } else if (success === "password-reset") {
      setSuccessMessage(
        "Password updated successfully! Please sign in with your new password.",
      );
      toast({
        title: "Password Reset Complete",
        description: "Your password has been updated. You can now sign in.",
      });
    } else if (message) {
      setSuccessMessage(decodeURIComponent(message));
    }

    // Clear URL parameters after showing message
    if (success || message) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Handle login attempt blocking
  useEffect(() => {
    if (isBlocked && blockTimer > 0) {
      const timer = setTimeout(() => {
        setBlockTimer(blockTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isBlocked && blockTimer === 0) {
      setIsBlocked(false);
      setLoginAttempts(0);
    }
  }, [isBlocked, blockTimer]);

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!email.includes("@")) {
      errors.push("Please enter a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (field: "email" | "password", value: string) => {
    if (field === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }

    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if blocked
    if (isBlocked) {
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed attempts. Please wait ${blockTimer} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Please Fix the Following Issues",
        description: `${validationErrors.length} validation error${validationErrors.length > 1 ? "s" : ""} found`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      // Reset login attempts on success
      setLoginAttempts(0);
      setIsBlocked(false);

      toast({
        title: "Welcome Back!",
        description: "Successfully logged in to your TravelCRM Pro account.",
      });

      // Navigate directly to dashboard (skip welcome screen)
      console.log("🎉 Login successful, navigating to dashboard");
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Block account after 5 failed attempts
      if (newAttempts >= 5) {
        setIsBlocked(true);
        setBlockTimer(300); // 5 minutes
        toast({
          title: "Account Temporarily Locked",
          description:
            "Too many failed login attempts. Your account is locked for 5 minutes for security.",
          variant: "destructive",
        });
        return;
      }

      // Handle specific error cases
      if (
        error.message?.includes("Invalid credentials") ||
        error.message?.includes("Invalid email or password")
      ) {
        toast({
          title: "Invalid Login Credentials",
          description: `Email or password is incorrect. ${5 - newAttempts} attempts remaining before temporary lockout.`,
          variant: "destructive",
        });
      } else if (
        error.message?.includes("User not found") ||
        error.message?.includes("not exist")
      ) {
        toast({
          title: "Account Not Found",
          description:
            "No account found with this email address. Please check your email or create a new account.",
          variant: "destructive",
        });
      } else if (
        error.message?.includes("Account disabled") ||
        error.message?.includes("inactive")
      ) {
        toast({
          title: "Account Disabled",
          description:
            "Your account has been disabled. Please contact support for assistance.",
          variant: "destructive",
        });
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        toast({
          title: "Connection Error",
          description:
            "Unable to connect to our servers. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description:
            error.message ||
            `Login attempt failed. ${5 - newAttempts} attempts remaining.`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    console.log("🎉 Welcome screen complete, navigating to dashboard");
    setLocation("/dashboard");
  };

  if (showWelcomeScreen) {
    console.log("🎉 Rendering welcome screen");
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20"></div>
        
        {/* Animated Blobs */}
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
        
        {/* Grid Pattern Overlay */}
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
                  <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                  <p className="text-gray-600">Sign in to your account to continue</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50/80">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isBlocked}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Enter your password"
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        disabled={isBlocked}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isBlocked}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading || isBlocked}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      href="/register"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                    >
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
