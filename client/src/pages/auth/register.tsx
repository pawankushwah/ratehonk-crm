import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, UserCheck, UserX, Loader2, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Logo from "../../assets/Logo-sidebar.svg";

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
    
    // Simplified password validation - just require 6+ characters
    // Remove overly strict password requirements that prevent registration
    
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
      
      // Success notification with activation information
      toast({
        title: "Registration Successful!",
        description: "Please check your email and click the activation link to activate your account.",
      });
      
      // Redirect to login page with success message
      setTimeout(() => {
        setLocation("/login?success=registered");
      }, 1000);
      
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
                <p className="text-gray-600">Start setting up your account ✋</p>
              </div>
            </div>
            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Please fix the following issues:</div>
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
              <Alert variant="destructive" className="mb-4">
                <UserX className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Email Already Registered</div>
                  <div className="text-sm mt-1">
                    This email is already associated with an account. 
                    <Link href="/login">
                      <a className="underline ml-1">Click here to log in</a>
                    </Link> or use a different email address.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="h-12 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg bg-gray-50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={(e) => checkEmailAvailability(e.target.value)}
                  placeholder="Enter Email Address"
                  className="h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                  required
                />
                {emailExists && (
                  <p className="text-sm text-red-600">This email is already registered</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Password"
                    className="h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company Name"
                  className="h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-400 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50" 
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
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-4">
                By signing up, you agree to our{" "}
                <Link href="#" className="text-gray-600 hover:underline underline">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-gray-600 hover:underline underline">
                  terms of use
                </Link>.
              </p>
              
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium">
                  Log In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
