import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserX, Loader2, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { PortfolioHeader } from "@/components/layout/portfolio-header";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    contactPhone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }

    // Clear email exists error when user modifies email
    if (name === 'email' && emailExists) {
      setEmailExists(false);
    }
  };

  // Email validation and duplicate check (temporarily disabled due to Vite routing)
  const checkEmailAvailability = async (email: string) => {
    // Temporarily disabled - email uniqueness will be checked during registration
    setEmailChecking(false);
    setEmailExists(false);
  };

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.firstName.trim()) errors.push("First name is required");
    if (!formData.lastName.trim()) errors.push("Last name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.email.includes('@')) errors.push("Please enter a valid email address");
    if (!formData.password) errors.push("Password is required");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters long");
    if (!formData.companyName.trim()) errors.push("Company name is required");
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Please Fix the Following Issues",
        description: `${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''} found`,
        variant: "destructive",
      });
      return;
    }

    // Check if email exists before proceeding
    if (emailExists) {
      toast({
        title: "Email Already Registered",
        description: "Please use a different email address or try logging in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registering user with data:', formData);
      const result = await auth.register(formData);
      console.log('✅ Registration successful:', result);
      console.log('📝 Result requiresEmailVerification:', result.requiresEmailVerification);
      console.log('📝 Result user:', result.user);
      
      // Check if email verification is required
      if (result.requiresEmailVerification) {
        // Store user ID and email for OTP verification page
        if (result.user?.id) {
          localStorage.setItem("pendingVerificationUserId", result.user.id.toString());
          localStorage.setItem("pendingVerificationEmail", formData.email);
        }
        
        // Success notification
        toast({
          title: "Registration Successful!",
          description: "Please check your email for the verification OTP to complete your registration.",
        });
        
        // Redirect to OTP verification page
        setTimeout(() => {
          setLocation(`/verify-otp?userId=${result.user?.id}&email=${encodeURIComponent(formData.email)}`);
        }, 1000);
      } else {
        // Legacy flow (shouldn't happen with new registration)
        toast({
          title: "Welcome to RateHonk CRM!",
          description: "Account created successfully! Your 14-day free trial has started.",
        });
        
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message?.includes("already exists") || error.message?.includes("User already exists")) {
        setEmailExists(true);
        toast({
          title: "Email Already Registered",
          description: "This email is already associated with an account. Please try logging in or use a different email.",
          variant: "destructive",
        });
      } else if (error.message?.includes("password")) {
        toast({
          title: "Password Error",
          description: error.message || "Please check your password requirements.",
          variant: "destructive",
        });
      } else if (error.message?.includes("company") || error.message?.includes("tenant")) {
        toast({
          title: "Company Registration Error",
          description: "There was an issue setting up your company account. Please try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to our servers. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "An unexpected error occurred. Please try again or contact support if the issue persists.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortfolioHeader showSignUpButton={false} showSignInButton={true} />
      
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
        <div className="w-full max-w-2xl">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-8 lg:p-10">
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
                  <p className="text-gray-600">Get started with your 14-day free trial</p>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Please fix the following issues:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Exists Alert */}
                {emailExists && (
                  <Alert variant="destructive">
                    <UserX className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-1">Email Already Registered</div>
                      <div className="text-sm mt-1">
                        This email is already associated with an account.{" "}
                        <Link href="/login" className="underline font-medium hover:text-blue-600">
                          Click here to log in
                        </Link> or use a different email address.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={(e) => checkEmailAvailability(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    {emailExists && (
                      <p className="text-sm text-red-600 font-medium mt-1">
                        This email is already registered
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Your Company Name"
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={loading || emailExists || emailChecking || validationErrors.length > 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : emailChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking Email...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <p className="text-center text-xs text-gray-500">
                    By signing up, you agree to our{" "}
                    <Link href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                      Terms of Service
                    </Link>
                  </p>
                  
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                      Sign In
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
