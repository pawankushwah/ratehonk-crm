export interface DashboardMetrics {
  revenue: number;
  activeBookings: number;
  customers: number;
  leads: number;
  lowStock: number;
  topSellingProducts: Array<{
    id: number;
    name: string;
    sold: number;
  }>;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentBookings: any[];
  topPackages: any[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    bookings: number;
    leads: number;
  }>;
  stats: {
    conversionRate: number;
    avgBookingValue: number;
    customerSatisfaction: number;
    avgResponseTime: number;
  };
}

export interface SaasDashboardData {
  totalTenants: number;
  monthlyRevenue: number;
  activeTrials: number;
  growthRate: number;
  recentTenants: any[];
}

export interface Customer {
  id: number;
  tenantId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  preferences?: Record<string, any>;
  notes?: string;
  status: string;
  createdAt: Date;
}

export interface Lead {
  id: number;
  tenantId: number;
  leadTypeId: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
  convertedToCustomerId?: number;
  score?: number;
  priority?: string;
  budgetRange?: string;
  country?: string;
  state?: string;
  city?: string;
  typeSpecificData?: Record<string, any>;
  lastContactDate?: Date;
  emailOpens?: number;
  emailClicks?: number;
  websiteVisits?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelPackage {
  id: number;
  tenantId: number;
  packageTypeId: number;
  name: string;
  description?: string;
  destination: string;
  duration: number;
  price: string;
  maxCapacity: number;
  inclusions?: string[];
  exclusions?: string[];
  isActive: boolean;
  createdAt: Date;
  // Enhanced fields matching database schema
  durationType?: string;
  region?: string;
  country?: string;
  city?: string;
  packageStayingImage?: string;
  altName?: string;
  vendorName?: string;
  rating?: number;
  status?: string;
  itineraryImages?: any;
  itineraryDescription?: string;
  cancellationPolicy?: string;
  cancellationBenefit?: string;
  dayWiseItinerary?: any;
  itinerary?: string;
  image?: string;
}

export interface Booking {
  id: number;
  tenantId: number;
  customerId: number;
  packageId: number;
  bookingNumber: string;
  status: string;
  travelers: number;
  travelDate: Date;
  totalAmount: string;
  amountPaid: string;
  paymentStatus: string;
  paymentType?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt?: Date;
  customerName?: string;
  customerEmail?: string;
  packageName?: string;
  packageDestination?: string;
  leadId?: number;
  leadTypeId?: number;
  // New fields for enhanced booking management
  purchasePrice?: string;
  sellingPrice?: string;
  invoiceNo?: string;
  voucherNo?: string;
  vendorId?: number;
  passengers?: any[];
  lineItems?: any[];
  // API response properties (snake_case)
  booking_number?: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  package_id?: number;
  package_name?: string;
  package_destination?: string;
  total_amount?: string;
  amount_paid?: string;
  payment_status?: string;
  special_requests?: string;
  travel_date?: Date;
  created_at?: Date;
  updated_at?: Date;
  lead_id?: number;
  lead_type_id?: number;
  purchase_price?: string;
  selling_price?: string;
  invoice_no?: string;
  voucher_no?: string;
  vendor_id?: number;
  line_items?: any[];
}

export interface PackageType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  displayOrder: number;
  packageCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  monthlyPrice: string;
  yearlyPrice: string;
  maxUsers: number;
  maxCustomers: number;
  features: string[];
  isActive: boolean;
}
