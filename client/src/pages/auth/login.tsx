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
import { auth } from "@/lib/auth";
import { WelcomeScreen } from "@/components/ui/welcome-screen";
import Logo from "../../assets/Logo-sidebar.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState<number | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [, setLocation] = useLocation();
  const { login: loginViaAuth, setAuthData } = useAuth();
  const { toast } = useToast();

  // Check for URL parameters (success messages from registration, password reset, activation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const message = urlParams.get("message");
    const activated = urlParams.get("activated");

    if (activated === "true") {
      setSuccessMessage(
        "Account activated successfully! Please sign in with your credentials.",
      );
      toast({
        title: "Account Activated!",
        description: "Your account has been activated. You can now sign in.",
      });
    } else if (success === "registered") {
      setSuccessMessage(
        "Account created successfully! Please check your email to activate your account.",
      );
      toast({
        title: "Registration Successful!",
        description:
          "Please check your email and click the activation link to activate your account.",
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
    setVerificationError("");

    try {
      // Call auth.login directly to handle verification requirement
      const result = await auth.login(email, password);
      
      // Check if verification is required
      if (result && typeof result === 'object' && 'requiresVerification' in result && result.requiresVerification) {
        setRequiresVerification(true);
        setVerificationUserId(result.userId);
        setLoading(false);
        toast({
          title: "Verification Code Sent",
          description: result.message || "Please check your email for the verification code.",
        });
        return;
      }

      // If we get here, login was successful (shouldn't happen with new system)
      // Update auth provider state by calling loginViaAuth
      await loginViaAuth(email, password);
      setLoading(false);
      
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

      // Check if account requires activation
      if (error.message?.includes("activate your account") || error.message?.includes("requiresActivation")) {
        toast({
          title: "Account Not Activated",
          description: "Please activate your account by clicking the activation link sent to your email before logging in.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }

    if (!verificationUserId) {
      setVerificationError("Session expired. Please login again.");
      return;
    }

    setVerifying(true);
    setVerificationError("");

    try {
      const result = await auth.verifyLoginCode(verificationUserId, verificationCode);
      
      // Login successful - auth.verifyLoginCode already stored token in localStorage
      // Now update the auth provider state with the result
      setAuthData({
        user: result.user,
        tenant: result.tenant || null,
      });
      
      toast({
        title: "Welcome Back!",
        description: "Successfully logged in to your account.",
      });

      // Use full page reload to ensure auth state is properly initialized
      // This ensures ProtectedRoute sees the authenticated state
      setTimeout(() => {
        window.location.href = "/modules";
      }, 100);
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationError(error.message || "Invalid verification code. Please try again.");
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationUserId) {
      toast({
        title: "Error",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      await auth.resendVerificationCode(verificationUserId);
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
      setVerificationCode("");
      setVerificationError("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    setRequiresVerification(false);
    setVerificationUserId(null);
    setVerificationCode("");
    setVerificationError("");
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

            {!requiresVerification ? (
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
                    placeholder="Enter Email Address"
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
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Verification code sent to <strong>{email}</strong>. Please check your email and enter the 6-digit code below.
                  </AlertDescription>
                </Alert>

                {verificationError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{verificationError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="verificationCode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(value);
                      setVerificationError("");
                    }}
                    placeholder="000000"
                    className="h-12 border-2 rounded-lg bg-gray-50 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50"
                  disabled={verifying || verificationCode.length !== 6}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendCode}
                    disabled={resending}
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToLogin}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            )}

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
