import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { FloatingWhatsAppButton } from "@/components/whatsapp/floating-whatsapp-button";
import { FloatingZoomButton } from "@/components/zoom/floating-zoom-button";
// Basic page imports
import NotFound from "@/pages/not-found";
// Temporarily using a simple login component
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Activate from "@/pages/auth/activate";

// Core page imports
import Welcome from "@/pages/welcome";
import Modules from "@/pages/modules";
// Temporarily disabled for debugging
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import TenantDashboard from "@/pages/tenant/dashboard";
import Customers from "@/pages/tenant/customers";
import CustomerDetail from "@/pages/tenant/customer-detail";
// Tenant page imports
// Temporarily disabled for debugging
import Leads from "@/pages/tenant/leads";
import LeadCreate from "@/pages/tenant/lead-create";
import LeadEdit from "@/pages/tenant/lead-edit";
import LeadTypes from "@/pages/tenant/lead-types";
import LeadSync from "@/pages/tenant/lead-sync";
import SocialIntegrations from "@/pages/tenant/social-integrations";
import UnifiedSocialDashboard from "@/pages/tenant/unified-social-dashboard";
import FacebookBusinessSuite from "@/pages/tenant/facebook-business-suite";
// import LinkedInBusinessSuite from "@/pages/tenant/linkedin-business-suite";
import EmailCampaigns from "@/pages/tenant/email-campaigns";
import EmailAutomations from "@/pages/tenant/email-automations";
import EmailABTests from "@/pages/tenant/email-ab-tests";
import EmailSegments from "@/pages/tenant/email-segments";
import EmailSettings from "@/pages/tenant/email-settings";
import EmailTest from "@/pages/tenant/email-test";
import GmailEmails from "@/pages/tenant/gmail-emails";
import Settings from "@/pages/tenant/settings";
import Support from "@/pages/tenant/support";
import Subscription from "@/pages/tenant/subscription";
import Bookings from "@/pages/tenant/bookings";
import BookingCreate from "@/pages/tenant/booking-create";
import TravelPackages from "@/pages/tenant/packages";
import PackageTypes from "@/pages/tenant/package-types";
import Invoices from "@/pages/tenant/invoices";
import InvoiceCreate from "@/pages/tenant/invoice-create";
import Communications from "@/pages/tenant/communications";
import Tasks from "@/pages/tenant/tasks";
import Shortcuts from "@/pages/tenant/shortcuts";
import Reports from "@/pages/tenant/reports";
import SaasDashboard from "@/pages/saas/dashboard";
import LeadAnalytics from "@/pages/tenant/lead-analytics";
import AutomationWorkflows from "@/pages/tenant/automation-workflows";
import BookingRecommendations from "@/pages/tenant/booking-recommendations";
import MenuOrdering from "@/pages/tenant/menu-ordering";
import Calendar from "@/pages/tenant/calendar";
// Temporarily disabled for debugging
// import EnhancedCRMDashboard from "@/pages/tenant/enhanced-crm-dashboard";
import DynamicFields from "@/pages/tenant/dynamic-fields";
import Roles from "@/pages/tenant/roles";
import Users from "@/pages/tenant/users";
import Estimates from "@/pages/tenant/estimates";
import EstimateCreate from "@/pages/tenant/estimate-create";
import Vendors from "@/pages/tenant/vendors";
import ServiceProviders from "@/pages/tenant/service-providers";
import Expenses from "@/pages/tenant/expenses";
import ExpenseCreate from "@/pages/tenant/expense-create";
import Flights from "@/pages/tenant/flights";
import FlightDetail from "@/pages/tenant/flight-detail";
import Hotels from "@/pages/tenant/hotels";
import HotelsList from "@/pages/tenant/hotels-list";
import HotelsDetails from "@/pages/tenant/hotels-details";
import TravelSearchB2C from "@/pages/tenant/travel-search-b2c";
import TravelSearchB2B from "@/pages/tenant/travel-search-b2b";
import WhatsApp from "@/pages/tenant/whatsapp";
import WhatsAppMessaging from "@/pages/tenant/whatsapp-messages";
import WhatsAppDevices from "@/pages/tenant/whatsapp-devices";
import WhatsAppDeviceConnect from "@/pages/tenant/whatsapp-device-connect";
import WhatsAppSetup from "@/pages/tenant/whatsapp-setup";
// Portfolio import
import Portfolio from "@/pages/portfolio";
import GstSettings from "@/pages/tenant/gst-settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/portfolio" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow login component to handle its own welcome screen flow
  // Don't auto-redirect if we're on the login page and authenticated
  if (isAuthenticated && window.location.pathname !== "/login") {
    return <Redirect to="/modules" />;
  }

  return <>{children}</>;
}

// Lazy load InvoicesNew to avoid import issues
const InvoicesNew = React.lazy(() => import("@/pages/tenant/invoices-new"));

function Router() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <Switch>
        {/* Public routes */}
        {/* Temporary simple login route */}
        <Route path="/login">
          <PublicRoute>
            <Login />
          </PublicRoute>
        </Route>

        <Route path="/register">
          <PublicRoute>
            <Register />
          </PublicRoute>
        </Route>

        <Route path="/activate">
          <PublicRoute>
            <Activate />
          </PublicRoute>
        </Route>

        <Route path="/portfolio">
          <Portfolio />
        </Route>

        {/* New Odoo-themed routes */}

        {/* Temporarily disabled for debugging */}
        <Route path="/forgot-password">
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        </Route>

        <Route path="/reset-password">
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        </Route>

        {/* Protected routes */}
        <Route path="/">
          <ProtectedRoute>
            <Redirect to="/modules" />
          </ProtectedRoute>
        </Route>

        {/* New welcome and module selection pages */}
        <Route path="/welcome">
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        </Route>

        <Route path="/modules">
          <ProtectedRoute>
            <Modules />
          </ProtectedRoute>
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute>
            <TenantDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/customers">
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        </Route>

        <Route path="/customers/:customerId">
          <ProtectedRoute>
            <CustomerDetail />
          </ProtectedRoute>
        </Route>

        {/* Temporarily disabled for debugging */}
        {/* <Route path="/crm-dashboard">
        <ProtectedRoute>
          <EnhancedCRMDashboard />
        </ProtectedRoute>
      </Route> */}

        {/* Temporarily disabled for debugging */}
        <Route path="/leads/create">
          <ProtectedRoute>
            <LeadCreate />
          </ProtectedRoute>
        </Route>

        <Route path="/leads/:id/edit">
          <ProtectedRoute>
            <LeadEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/leads">
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        </Route>

        <Route path="/lead-types">
          <ProtectedRoute>
            <LeadTypes />
          </ProtectedRoute>
        </Route>

        <Route path="/lead-sync">
          <ProtectedRoute>
            <LeadSync />
          </ProtectedRoute>
        </Route>

        <Route path="/social-integrations">
          <ProtectedRoute>
            <SocialIntegrations />
          </ProtectedRoute>
        </Route>

        <Route path="/unified-social-dashboard">
          <ProtectedRoute>
            <UnifiedSocialDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/facebook-business-suite">
          <ProtectedRoute>
            <FacebookBusinessSuite />
          </ProtectedRoute>
        </Route>

        <Route path="/email-campaigns">
          <ProtectedRoute>
            <EmailCampaigns />
          </ProtectedRoute>
        </Route>

        <Route path="/email-automations">
          <ProtectedRoute>
            <EmailAutomations />
          </ProtectedRoute>
        </Route>

        <Route path="/email-ab-tests">
          <ProtectedRoute>
            <EmailABTests />
          </ProtectedRoute>
        </Route>

        <Route path="/email-segments">
          <ProtectedRoute>
            <EmailSegments />
          </ProtectedRoute>
        </Route>

        <Route path="/email-settings">
          <ProtectedRoute>
            <EmailSettings />
          </ProtectedRoute>
        </Route>

        <Route path="/email-test">
          <ProtectedRoute>
            <EmailTest />
          </ProtectedRoute>
        </Route>

        <Route path="/gmail-emails">
          <ProtectedRoute>
            <GmailEmails />
          </ProtectedRoute>
        </Route>

        <Route path="/bookings/create">
          <ProtectedRoute>
            <BookingCreate />
          </ProtectedRoute>
        </Route>

        <Route path="/bookings">
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        </Route>

        <Route path="/flights">
          <ProtectedRoute>
            <Flights />
          </ProtectedRoute>
        </Route>

        <Route path="/flight-detail">
          <ProtectedRoute>
            <FlightDetail />
          </ProtectedRoute>
        </Route>

        <Route path="/hotels">
          <ProtectedRoute>
            <Hotels />
          </ProtectedRoute>
        </Route>

        <Route path="/hotels-list">
          <ProtectedRoute>
            <HotelsList />
          </ProtectedRoute>
        </Route>

        <Route path="/hotel-details">
          <ProtectedRoute>
            <HotelsDetails />
          </ProtectedRoute>
        </Route>

        <Route path="/travel-search-b2c">
          <ProtectedRoute>
            <TravelSearchB2C />
          </ProtectedRoute>
        </Route>

        <Route path="/travel-search-b2b">
          <ProtectedRoute>
            <TravelSearchB2B />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp">
          <ProtectedRoute>
            <WhatsApp />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-messages">
          <ProtectedRoute>
            <WhatsAppMessaging />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-devices">
          <ProtectedRoute>
            <WhatsAppDevices />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-devices/:id/connect">
          <ProtectedRoute>
            <WhatsAppDeviceConnect />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-setup">
          <ProtectedRoute>
            <WhatsAppSetup />
          </ProtectedRoute>
        </Route>

        <Route path="/packages">
          <ProtectedRoute>
            <TravelPackages />
          </ProtectedRoute>
        </Route>

        <Route path="/package-types">
          <ProtectedRoute>
            <PackageTypes />
          </ProtectedRoute>
        </Route>

        <Route path="/invoices">
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        </Route>

        <Route path="/invoice-create/:id?">
          <ProtectedRoute>
            <InvoiceCreate />
          </ProtectedRoute>
        </Route>

        <Route path="/invoices-new">
          <ProtectedRoute>
            <InvoicesNew />
          </ProtectedRoute>
        </Route>

        <Route path="/gst-settings">
          <ProtectedRoute>
            <GstSettings />
          </ProtectedRoute>
        </Route>

        <Route path="/tenant/:tenantId/invoices">
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        </Route>

        <Route path="/tenant/:tenantId/bookings">
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        </Route>

        <Route path="/tenant/:tenantId/customers/:customerId">
          <ProtectedRoute>
            <CustomerDetail />
          </ProtectedRoute>
        </Route>

        <Route path="/communications">
          <ProtectedRoute>
            <Communications />
          </ProtectedRoute>
        </Route>

        <Route path="/tasks">
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        </Route>

        <Route path="/shortcuts">
          <ProtectedRoute>
            <Shortcuts />
          </ProtectedRoute>
        </Route>

        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>

        <Route path="/lead-analytics">
          <ProtectedRoute>
            <LeadAnalytics />
          </ProtectedRoute>
        </Route>

        <Route path="/automation-workflows">
          <ProtectedRoute>
            <AutomationWorkflows />
          </ProtectedRoute>
        </Route>

        <Route path="/booking-recommendations">
          <ProtectedRoute>
            <BookingRecommendations />
          </ProtectedRoute>
        </Route>

        <Route path="/menu-ordering">
          <ProtectedRoute>
            <MenuOrdering />
          </ProtectedRoute>
        </Route>

        <Route path="/calendar">
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        </Route>

        <Route path="/dynamic-fields">
          <ProtectedRoute>
            <DynamicFields />
          </ProtectedRoute>
        </Route>

        <Route path="/roles">
          <ProtectedRoute>
            <Roles />
          </ProtectedRoute>
        </Route>

        <Route path="/users">
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        </Route>

        <Route path="/estimates/create">
          <ProtectedRoute>
            <EstimateCreate />
          </ProtectedRoute>
        </Route>

        <Route path="/estimates">
          <ProtectedRoute>
            <Estimates />
          </ProtectedRoute>
        </Route>

        <Route path="/vendors">
          <ProtectedRoute>
            <Vendors />
          </ProtectedRoute>
        </Route>

        <Route path="/service-providers">
          <ProtectedRoute>
            <ServiceProviders />
          </ProtectedRoute>
        </Route>

        <Route path="/expenses/create">
          <ProtectedRoute>
            <ExpenseCreate />
          </ProtectedRoute>
        </Route>

        <Route path="/expenses">
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        </Route>

        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>

        <Route path="/support">
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        </Route>

        <Route path="/subscription">
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        </Route>

        {/* SaaS Owner routes */}
        <Route path="/saas/dashboard">
          <ProtectedRoute>
            <SaasDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/saas/tenants">
          <ProtectedRoute>
            <SaasDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/saas/plans">
          <ProtectedRoute>
            <SaasDashboard />
          </ProtectedRoute>
        </Route>

        {/* Fallback routes */}
        <Route component={NotFound} />
      </Switch>
    </React.Suspense>
  );
}

function AuthenticatedFloatingButtons() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Hide buttons on public pages and modules page
  if (!isAuthenticated || location === "/modules") {
    return null;
  }
  
  return (
    <>
      <FloatingWhatsAppButton />
      <FloatingZoomButton />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedFloatingButtons />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
