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
import Logo from "../../assets/Logo-sidebar.svg";

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

      // Show welcome screen with fireworks animation
      console.log("🎉 Setting welcome screen to true");
      setShowWelcomeScreen(true);
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
    console.log("🎉 Welcome screen complete, navigating to modules");
    setLocation("/modules");
  };

  if (showWelcomeScreen) {
    console.log("🎉 Rendering welcome screen");
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

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
              {/* <p className="text-gray-500 text-sm mb-8">
                Marketing / SEO / Web Development
              </p> */}

              <div className="mb-6">
                {/* <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back 😍
                </h2> */}
                <p className="text-gray-600">
                  Log in to continue. We're excited to have you back!
                </p>
              </div>
            </div>
            {/* Success Message Alert */}
            {successMessage && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-6">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Demo@gmail.com"
                  className="h-12 border-2 rounded-lg bg-gray-50"
                  disabled={isBlocked}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Enter Password"
                    className="h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg pr-10"
                    disabled={isBlocked}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50"
                disabled={loading || isBlocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account yet?{" "}
                <Link
                  href="/register"
                  className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
