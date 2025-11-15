import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ResetPassword() {
  const [location] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email?: string;
    userName?: string;
  }>({});
  console.log(location, "location");

  // Redirect to correct domain if accessed from wrong domain
  useEffect(() => {
    const currentHost = window.location.hostname;
    const correctDomain = "crm.ratehonk.com";
    
    // Check if we're on the wrong domain (your-app-url.com or any other wrong domain)
    if (currentHost !== correctDomain && (currentHost.includes("your-app-url.com") || currentHost !== "localhost" && currentHost !== "127.0.0.1")) {
      // Extract token from current URL (handle both token and subid1 parameters)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get("token");
      
      if (tokenParam) {
        // Redirect to correct domain with token only (remove subid1 and other tracking params)
        const correctUrl = `https://${correctDomain}/reset-password?token=${tokenParam}`;
        console.log("🔄 Redirecting from wrong domain:", currentHost);
        console.log("🔄 Redirecting to correct domain:", correctUrl);
        window.location.replace(correctUrl); // Use replace instead of href to avoid back button issues
        return;
      } else {
        // If no token, just redirect to login
        console.log("🔄 No token found, redirecting to login");
        window.location.replace(`https://${correctDomain}/login`);
        return;
      }
    }
  }, []);
  // useEffect(() => {
  //   // Extract token from URL parameters
  //   console.log("🔍 Current location:", location);
  //   const urlParams = new URLSearchParams(location.split("?")[1] || "");
  //   const urlToken = urlParams.get("token");

  //   console.log("🔍 URL params:", location.split("?")[1] || "none");
  //   console.log("🔍 Extracted token:", urlToken || "none");

  //   if (urlToken) {
  //     console.log("✅ Token found, validating...");
  //     setToken(urlToken);
  //     validateToken(urlToken);
  //   } else {
  //     console.log("❌ No token found in URL");
  //     setError("No reset token provided");
  //     setIsValidatingToken(false);
  //   }
  // }, [location]);

  useEffect(() => {
    // ✅ Use window.location.search for query params
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlToken = urlParams.get("token");

    console.log("🔍 Current path:", location);
    console.log("🔍 Query string:", queryString || "none");
    console.log("🔍 Extracted token:", urlToken || "none");

    if (urlToken) {
      console.log("✅ Token found, validating...");
      setToken(urlToken);
      validateToken(urlToken);
    } else {
      console.log("❌ No token found in URL");
      setError("No reset token provided");
      setIsValidatingToken(false);
    }
  }, [location]); // location changes when the route changes

  const validateToken = async (resetToken: string) => {
    try {
      console.log("🔐 Validating token:", resetToken);
      const response = await fetch(
        `/api/auth/validate-reset-token/${resetToken}`,
      );
      const data = await response.json();

      console.log("🔐 Validation response:", data);

      if (data.valid) {
        console.log("✅ Token is valid");
        setTokenValid(true);
        setUserInfo({ email: data.email, userName: data.userName });
      } else {
        console.log("❌ Token is invalid:", data.message);
        setError(data.message || "Invalid or expired reset token");
        setTokenValid(false);
      }
    } catch (error) {
      console.error("❌ Token validation error:", error);
      setError("Error validating reset token");
      setTokenValid(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Validating reset token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm text-gray-600">
              <p>This reset link may have expired or already been used.</p>
              <p>Password reset links are valid for 1 hour only.</p>
            </div>
            <div className="space-y-2">
              <Link href="/forgot-password">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
              <CardDescription className="text-gray-600">
                {userInfo.userName ? `Hello ${userInfo.userName}! ` : ""}
                Create a new password for your account
              </CardDescription>
              {userInfo.email && (
                <p className="text-sm text-gray-500 mt-2">
                  Resetting password for: {userInfo.email}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
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
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    Password Reset Successful!
                  </h3>
                  <Alert className="border-green-200 bg-green-50 text-left">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Your password has been reset successfully. You can now log
                      in with your new password.
                    </AlertDescription>
                  </Alert>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {!isSuccess && (
          <div className="text-center text-sm text-gray-600">
            <p>
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
