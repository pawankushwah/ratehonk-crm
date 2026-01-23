import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { useLocation, Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await auth.login(data.email, data.password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      setLocation("/leads");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoAccount = async () => {
    setIsLoading(true);
    try {
      const demoData = {
        email: "demo@travelcrm.com",
        password: "demo123",
        firstName: "Demo",
        lastName: "User",
        companyName: "RateHonk CRM Demo",
        contactPhone: "(555) 123-4567",
        address: "123 Travel Street, Tourism City, TC 12345"
      };

      await auth.register(demoData);
      toast({
        title: "Demo Account Created!",
        description: "You're now logged in to your travel CRM!",
      });
      setLocation("/leads");
    } catch (error: any) {
      toast({
        title: "Demo Setup Failed",
        description: error.message || "Could not create demo account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row items-center justify-center px-6 py-10 gap-10">
      {/* Left: Login Card */}
      <Card className="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-semibold text-gray-900 dark:text-white">
            Travel CRM Login
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage your leads and grow your business
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" autoComplete="off" data-form-type="other">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" autoComplete="off" data-form-type="other" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password">
                        <Button variant="link" size="sm" className="text-xs p-0 h-auto text-primary hover:underline">
                          Forgot?
                        </Button>
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" data-form-type="other" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">
                Or try a demo
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={createDemoAccount}
            disabled={isLoading}
          >
            {isLoading ? "Creating Demo..." : "Create Demo Account"}
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Includes sample leads and intelligent scoring!
          </p>

          <div className="text-center mt-6 border-t pt-4 border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Trouble signing in?
            </p>
            <Link href="/forgot-password">
              <Button variant="ghost" size="sm" className="text-primary hover:underline">
                Reset your password
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Right: Feature Section */}
      <div className="max-w-md w-full lg:ml-12 text-left lg:text-left px-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          The Complete Business Management Platform
        </h2>
        <ul className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Multi-Domain CRM & ERP:</strong> Manage travel, retail, services, and more with one platform
          </li>
          <li>
            <strong>Marketing & SEO Tools:</strong> Comprehensive marketing automation and SEO optimization
          </li>
          <li>
            <strong>Web Development Ready:</strong> Built for modern businesses with cutting-edge technology
          </li>
          <li>
            <strong>Trusted by 10,000+ businesses worldwide</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
