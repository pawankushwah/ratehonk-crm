import { 
  users, tenants, subscriptionPlans, tenantSubscriptions, 
  customers, leads, leadTypes, serviceProviders, packageTypes, travelPackages, bookings, socialIntegrations, emailCampaigns, emailConfigurations,
  estimates, estimateLineItems, estimateEmailLogs, callLogs, customerFiles, dashboardPreferences,
  type User, type InsertUser, type Tenant, type InsertTenant,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type TenantSubscription, type InsertTenantSubscription,
  type Customer, type InsertCustomer, type Lead, type InsertLead,
  type ServiceProvider, type InsertServiceProvider,
  type PackageType, type InsertPackageType,
  type TravelPackage, type InsertTravelPackage,
  type Booking, type InsertBooking, type SocialIntegration, type InsertSocialIntegration,
  type EmailCampaign, type InsertEmailCampaign, type EmailConfiguration, type InsertEmailConfiguration,
  type Estimate, type InsertEstimate, type EstimateLineItem, type InsertEstimateLineItem,
  type EstimateEmailLog, type InsertEstimateEmailLog, type CallLog, type InsertCallLog,
  type CustomerFile, type InsertCustomerFile, type DashboardPreference, type InsertDashboardPreference
} from "./../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, count, getTableColumns } from "drizzle-orm";
import postgres from "postgres";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Tenants
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | undefined>;

  // Subscription Plans
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;

  // Tenant Subscriptions
  getTenantSubscription(tenantId: number): Promise<TenantSubscription | undefined>;
  createTenantSubscription(subscription: InsertTenantSubscription): Promise<TenantSubscription>;
  updateTenantSubscription(id: number, updates: Partial<InsertTenantSubscription>): Promise<TenantSubscription | undefined>;

  // Customers
  getCustomersByTenant(tenantId: number): Promise<Customer[]>;
  getCustomer(id: number, tenantId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, tenantId: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number, tenantId: number): Promise<boolean>;

  // Leads
  getLeadsByTenant(tenantId: number): Promise<Lead[]>;
  getLead(id: number, tenantId: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, tenantId: number, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number, tenantId: number): Promise<boolean>;
  updateLeadScore(id: number, tenantId: number, score: number, priority: string): Promise<Lead | undefined>;
  getLeadsByPriority(tenantId: number, priority: string): Promise<Lead[]>;
  getTopScoredLeads(tenantId: number, limit?: number): Promise<Lead[]>;
  convertLeadToCustomer(leadId: number, tenantId: number): Promise<{ customer: Customer; leadId: number; convertedAt: string }>;

  // Lead Types Management
  getLeadTypesByTenant(tenantId: number): Promise<any[]>;
  createLeadType(leadTypeData: any): Promise<any>;
  updateLeadType(leadTypeId: number, leadTypeData: any): Promise<any>;
  deleteLeadType(leadTypeId: number): Promise<void>;
  getLeadTypeFieldsByLeadType(leadTypeId: number): Promise<any[]>;
  createLeadTypeField(fieldData: any): Promise<any>;

  // Service Providers
  getServiceProvidersByTenant(tenantId: number): Promise<any[]>;
  getServiceProvidersByLeadType(tenantId: number, leadTypeId: number): Promise<any[]>;
  getServiceProvider(id: number, tenantId: number): Promise<any | undefined>;
  createServiceProvider(serviceProvider: any): Promise<any>;
  updateServiceProvider(id: number, tenantId: number, updates: any): Promise<any | undefined>;
  deleteServiceProvider(id: number, tenantId: number): Promise<boolean>;

  // Package Types
  getPackageTypesByTenant(tenantId: number): Promise<PackageType[]>;
  getPackageType(id: number, tenantId: number): Promise<PackageType | undefined>;
  createPackageType(packageType: InsertPackageType): Promise<PackageType>;
  updatePackageType(id: number, tenantId: number, updates: Partial<InsertPackageType>): Promise<PackageType | undefined>;
  deletePackageType(id: number, tenantId: number): Promise<boolean>;

  // Travel Packages
  getTravelPackagesByTenant(tenantId: number): Promise<TravelPackage[]>;
  getTravelPackage(id: number, tenantId: number): Promise<TravelPackage | undefined>;
  createTravelPackage(travelPackage: InsertTravelPackage): Promise<TravelPackage>;
  updateTravelPackage(id: number, tenantId: number, updates: Partial<InsertTravelPackage>): Promise<TravelPackage | undefined>;
  deleteTravelPackage(id: number, tenantId: number): Promise<boolean>;

  // Bookings
  getBookingsByTenant(tenantId: number): Promise<Booking[]>;
  getBookingsByCustomer(tenantId: number, customerId: number): Promise<Booking[]>;
  getBooking(id: number, tenantId: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, tenantId: number, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number, tenantId: number): Promise<boolean>;

  // Analytics
  getTenantDashboardData(tenantId: number): Promise<any>;
  getSaasDashboardData(): Promise<any>;
  getChartData(tenantId: number, filters: { period?: string; startDate?: string; endDate?: string }): Promise<any>;

  // Social Media Integrations
  getSocialIntegrationsByTenant(tenantId: number): Promise<SocialIntegration[]>;
  getSocialIntegration(id: number, tenantId: number): Promise<SocialIntegration | undefined>;
  getSocialIntegrationByPlatform(platform: string, tenantId: number): Promise<SocialIntegration | undefined>;
  createSocialIntegration(integration: InsertSocialIntegration): Promise<SocialIntegration>;
  updateSocialIntegration(id: number, tenantId: number, updates: Partial<InsertSocialIntegration>): Promise<SocialIntegration | undefined>;
  deleteSocialIntegration(id: number, tenantId: number): Promise<boolean>;

  // Email Campaigns
  getEmailCampaignsByTenant(tenantId: number): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number, tenantId: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, tenantId: number, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number, tenantId: number): Promise<boolean>;
  getEmailCampaignStats(tenantId: number): Promise<any>;

  // Email Configuration
  getEmailConfiguration(tenantId: number): Promise<EmailConfiguration | undefined>;
  upsertEmailConfiguration(config: InsertEmailConfiguration): Promise<EmailConfiguration>;

  // Estimates
  getEstimatesByTenant(tenantId: number): Promise<Estimate[]>;
  getEstimate(id: number, tenantId: number): Promise<Estimate | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, tenantId: number, updates: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: number, tenantId: number): Promise<boolean>;
  
  // Estimate Line Items
  getEstimateLineItems(estimateId: number): Promise<EstimateLineItem[]>;
  createEstimateLineItem(lineItem: InsertEstimateLineItem): Promise<EstimateLineItem>;
  updateEstimateLineItem(id: number, updates: Partial<InsertEstimateLineItem>): Promise<EstimateLineItem | undefined>;
  deleteEstimateLineItem(id: number): Promise<boolean>;
  
  // Estimate Email Logs
  createEstimateEmailLog(emailLog: InsertEstimateEmailLog): Promise<EstimateEmailLog>;
  getEstimateEmailLogs(estimateId: number): Promise<EstimateEmailLog[]>;
  
  // Customer Files
  getCustomerFilesByCustomer(customerId: number, tenantId: number): Promise<CustomerFile[]>;
  getCustomerFile(id: number, tenantId: number): Promise<CustomerFile | undefined>;
  createCustomerFile(customerFile: InsertCustomerFile): Promise<CustomerFile>;
  updateCustomerFile(id: number, tenantId: number, updates: Partial<InsertCustomerFile>): Promise<CustomerFile | undefined>;
  deleteCustomerFile(id: number, tenantId: number): Promise<boolean>;
  
  // Call Logs
  getCallLogsByTenant(tenantId: number): Promise<CallLog[]>;
  getCallLogsByCustomer(customerId: number, tenantId: number): Promise<CallLog[]>;
  getCallLog(id: number, tenantId: number): Promise<CallLog | undefined>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  updateCallLog(id: number, tenantId: number, updates: Partial<InsertCallLog>): Promise<CallLog | undefined>;
  deleteCallLog(id: number, tenantId: number): Promise<boolean>;
  
  // Dashboard Preferences
  getDashboardPreferences(tenantId: number, userId?: number): Promise<DashboardPreference[]>;
  getDashboardPreference(componentKey: string, tenantId: number, userId?: number): Promise<DashboardPreference | undefined>;
  upsertDashboardPreference(preference: InsertDashboardPreference): Promise<DashboardPreference>;
  deleteDashboardPreference(componentKey: string, tenantId: number, userId?: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private tenants: Map<number, Tenant> = new Map();
  private subscriptionPlans: Map<number, SubscriptionPlan> = new Map();
  private tenantSubscriptions: Map<number, TenantSubscription> = new Map();
  private customers: Map<number, Customer> = new Map();
  private leads: Map<number, Lead> = new Map();
  private travelPackages: Map<number, TravelPackage> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private callLogs: Map<number, CallLog> = new Map();
  private customerFiles: Map<number, CustomerFile> = new Map();
  
  private currentUserId = 1;
  private currentTenantId = 1;
  private currentPlanId = 1;
  private currentSubscriptionId = 1;
  private currentCustomerId = 1;
  private currentLeadId = 1;
  private currentPackageId = 1;
  private currentBookingId = 1;
  private currentCallLogId = 1;
  private currentCustomerFileId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default subscription plans
    const plans: InsertSubscriptionPlan[] = [
      {
        name: "Starter",
        description: "Perfect for small travel agencies",
        monthlyPrice: "49.00",
        yearlyPrice: "490.00",
        maxUsers: 2,
        maxCustomers: 100,
        features: ["Customer Management", "Basic Reporting", "Email Support"],
        isActive: true
      },
      {
        name: "Professional",
        description: "Ideal for growing travel businesses",
        monthlyPrice: "99.00",
        yearlyPrice: "990.00",
        maxUsers: 10,
        maxCustomers: 1000,
        features: ["All Starter Features", "Lead Management", "Advanced Reporting", "Priority Support"],
        isActive: true
      },
      {
        name: "Enterprise",
        description: "For large travel organizations",
        monthlyPrice: "199.00",
        yearlyPrice: "1990.00",
        maxUsers: -1, // unlimited
        maxCustomers: -1, // unlimited
        features: ["All Professional Features", "Custom Integrations", "Dedicated Support", "White Label"],
        isActive: true
      }
    ];

    plans.forEach(plan => this.createSubscriptionPlan(plan));

    // Create SaaS owner
    this.createUser({
      email: "admin@travelcrm.com",
      password: "admin123",
      role: "saas_owner",
      firstName: "Admin",
      lastName: "User",
      isActive: true
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Tenants
  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(tenant => tenant.subdomain === subdomain);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const id = this.currentTenantId++;
    const newTenant: Tenant = {
      ...tenant,
      id,
      createdAt: new Date()
    };
    this.tenants.set(id, newTenant);
    return newTenant;
  }

  async updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(id);
    if (!tenant) return undefined;
    
    const updatedTenant = { ...tenant, ...updates };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  // Subscription Plans
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values()).filter(plan => plan.isActive);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.currentPlanId++;
    const newPlan: SubscriptionPlan = {
      ...plan,
      id,
      createdAt: new Date()
    };
    this.subscriptionPlans.set(id, newPlan);
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = this.subscriptionPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...updates };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Tenant Subscriptions
  async getTenantSubscription(tenantId: number): Promise<TenantSubscription | undefined> {
    return Array.from(this.tenantSubscriptions.values()).find(sub => sub.tenantId === tenantId);
  }

  async createTenantSubscription(subscription: InsertTenantSubscription): Promise<TenantSubscription> {
    const id = this.currentSubscriptionId++;
    const newSubscription: TenantSubscription = {
      ...subscription,
      id,
      createdAt: new Date()
    };
    this.tenantSubscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateTenantSubscription(id: number, updates: Partial<InsertTenantSubscription>): Promise<TenantSubscription | undefined> {
    const subscription = this.tenantSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.tenantSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Customers
  async getCustomersByTenant(tenantId: number): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.tenantId === tenantId);
  }

  async getCustomer(id: number, tenantId: number): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    return customer && customer.tenantId === tenantId ? customer : undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: new Date()
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, tenantId: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer || customer.tenantId !== tenantId) return undefined;
    
    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number, tenantId: number): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer || customer.tenantId !== tenantId) return false;
    
    return this.customers.delete(id);
  }

  // Leads
  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.tenantId === tenantId);
  }

  async getLead(id: number, tenantId: number): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    return lead && lead.tenantId === tenantId ? lead : undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: new Date()
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, tenantId: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead || lead.tenantId !== tenantId) return undefined;
    
    const updatedLead = { ...lead, ...updates };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number, tenantId: number): Promise<boolean> {
    const lead = this.leads.get(id);
    if (!lead || lead.tenantId !== tenantId) return false;
    
    return this.leads.delete(id);
  }



  // Bookings
  async getBookingsByTenant(tenantId: number): Promise<Booking[]> {
    try {
      const result = await this.sql`
        SELECT 
          b.*,
          c.name as customer_name,
          c.email as customer_email,
          p.name as package_name,
          p.destination as package_destination
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN travel_packages p ON b.package_id = p.id
        WHERE b.tenant_id = ${tenantId}
        ORDER BY b.created_at DESC
      `;
      
      return result.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        customerId: row.customer_id,
        packageId: row.package_id,
        bookingNumber: row.booking_number,
        travelDate: row.travel_date,
        travelers: row.number_of_travelers,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
        paymentStatus: row.payment_status,
        paymentType: row.payment_type,
        status: row.booking_status || row.status,
        specialRequests: row.special_requests,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        packageName: row.package_name,
        packageDestination: row.package_destination
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  async getBooking(id: number, tenantId: number): Promise<Booking | undefined> {
    try {
      const result = await this.sql`
        SELECT 
          b.*,
          c.name as customer_name,
          c.email as customer_email,
          p.name as package_name,
          p.destination as package_destination
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN travel_packages p ON b.package_id = p.id
        WHERE b.id = ${id} AND b.tenant_id = ${tenantId}
      `;
      
      if (result.length === 0) return undefined;
      
      const row = result[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        customerId: row.customer_id,
        packageId: row.package_id,
        bookingNumber: row.booking_number,
        travelDate: row.travel_date,
        travelers: row.number_of_travelers,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
        paymentStatus: row.payment_status,
        paymentType: row.payment_type,
        status: row.booking_status || row.status,
        specialRequests: row.special_requests,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        packageName: row.package_name,
        packageDestination: row.package_destination
      };
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const query = `
      INSERT INTO bookings (
        tenant_id, customer_id, package_id, booking_number, 
        travel_date, number_of_travelers, total_amount, amount_paid,
        payment_status, payment_type, booking_status, status, special_requests,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const now = new Date();
    const values = [
      booking.tenantId,
      booking.customerId,
      booking.packageId || null,
      booking.bookingNumber,
      booking.travelDate,
      booking.travelers || booking.numberOfTravelers,
      booking.totalAmount,
      booking.amountPaid || '0.00',
      booking.paymentStatus || 'pending',
      booking.paymentType || 'partial',
      booking.status,
      booking.status, // Also store in status field for compatibility
      booking.specialRequests || null,
      now,
      now
    ];
    
    try {
      const result = await this.db.execute(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        customerId: row.customer_id,
        packageId: row.package_id,
        bookingNumber: row.booking_number,
        travelDate: row.travel_date,
        travelers: row.number_of_travelers,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
        paymentStatus: row.payment_status,
        paymentType: row.payment_type,
        status: row.booking_status || row.status,
        specialRequests: row.special_requests,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async updateBooking(id: number, tenantId: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.travelDate !== undefined) {
      fields.push(`travel_date = $${paramCount++}`);
      values.push(updates.travelDate);
    }
    if (updates.travelers !== undefined || updates.numberOfTravelers !== undefined) {
      fields.push(`number_of_travelers = $${paramCount++}`);
      values.push(updates.travelers || updates.numberOfTravelers);
    }
    if (updates.totalAmount !== undefined) {
      fields.push(`total_amount = $${paramCount++}`);
      values.push(updates.totalAmount);
    }
    if (updates.amountPaid !== undefined) {
      fields.push(`amount_paid = $${paramCount++}`);
      values.push(updates.amountPaid);
    }
    if (updates.paymentStatus !== undefined) {
      fields.push(`payment_status = $${paramCount++}`);
      values.push(updates.paymentStatus);
    }
    if (updates.paymentType !== undefined) {
      fields.push(`payment_type = $${paramCount++}`);
      values.push(updates.paymentType);
    }
    if (updates.status !== undefined) {
      fields.push(`booking_status = $${paramCount++}`);
      values.push(updates.status);
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.specialRequests !== undefined) {
      fields.push(`special_requests = $${paramCount++}`);
      values.push(updates.specialRequests);
    }
    
    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    
    values.push(id, tenantId);
    
    const query = `
      UPDATE bookings 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
      RETURNING *
    `;
    
    try {
      const result = await this.db.execute(query, values);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        customerId: row.customer_id,
        packageId: row.package_id,
        bookingNumber: row.booking_number,
        travelDate: row.travel_date,
        travelers: row.number_of_travelers,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
        paymentStatus: row.payment_status,
        paymentType: row.payment_type,
        status: row.booking_status || row.status,
        specialRequests: row.special_requests,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  async deleteBooking(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM bookings WHERE id = $1 AND tenant_id = $2`;
    
    try {
      const result = await this.db.execute(query, [id, tenantId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  // Analytics
  async getTenantDashboardData(tenantId: number): Promise<any> {
    const customers = await this.getCustomersByTenant(tenantId);
    const leads = await this.getLeadsByTenant(tenantId);
    const bookings = await this.getBookingsByTenant(tenantId);
    const packages = await this.getTravelPackagesByTenant(tenantId);

    const totalRevenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;

    return {
      metrics: {
        revenue: totalRevenue,
        activeBookings,
        customers: customers.length,
        leads: leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length
      },
      recentBookings: bookings.slice(-4).reverse(),
      topPackages: packages.slice(0, 4)
    };
  }

  async getSaasDashboardData(): Promise<any> {
    const tenants = await this.getAllTenants();
    const subscriptions = Array.from(this.tenantSubscriptions.values());
    
    const totalRevenue = subscriptions.reduce((sum, sub) => {
      const plan = this.subscriptionPlans.get(sub.planId);
      if (!plan) return sum;
      const price = sub.billingCycle === 'yearly' ? parseFloat(plan.yearlyPrice) : parseFloat(plan.monthlyPrice);
      return sum + price;
    }, 0);

    const activeTrials = subscriptions.filter(sub => sub.status === 'trial').length;

    return {
      totalTenants: tenants.length,
      monthlyRevenue: totalRevenue,
      activeTrials,
      growthRate: 24.5,
      recentTenants: tenants.slice(-5).reverse()
    };
  }

  // Call Logs
  async getCallLogsByTenant(tenantId: number): Promise<CallLog[]> {
    return Array.from(this.callLogs.values()).filter(log => log.tenantId === tenantId);
  }

  async getCallLogsByCustomer(customerId: number, tenantId: number): Promise<CallLog[]> {
    return Array.from(this.callLogs.values()).filter(log => 
      log.customerId === customerId && log.tenantId === tenantId
    );
  }

  async getCallLog(id: number, tenantId: number): Promise<CallLog | undefined> {
    const log = this.callLogs.get(id);
    return log && log.tenantId === tenantId ? log : undefined;
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const newLog: CallLog = {
      ...callLog,
      id: this.currentCallLogId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.callLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateCallLog(id: number, tenantId: number, updates: Partial<InsertCallLog>): Promise<CallLog | undefined> {
    const log = this.callLogs.get(id);
    if (!log || log.tenantId !== tenantId) return undefined;

    const updated: CallLog = {
      ...log,
      ...updates,
      updatedAt: new Date()
    };
    this.callLogs.set(id, updated);
    return updated;
  }

  async deleteCallLog(id: number, tenantId: number): Promise<boolean> {
    const log = this.callLogs.get(id);
    if (!log || log.tenantId !== tenantId) return false;
    
    return this.callLogs.delete(id);
  }

  // Customer Files
  async getCustomerFilesByCustomer(customerId: number, tenantId: number): Promise<CustomerFile[]> {
    return Array.from(this.customerFiles.values()).filter(file => 
      file.customerId === customerId && file.tenantId === tenantId
    );
  }

  async getCustomerFile(id: number, tenantId: number): Promise<CustomerFile | undefined> {
    const file = this.customerFiles.get(id);
    return file && file.tenantId === tenantId ? file : undefined;
  }

  async createCustomerFile(customerFile: InsertCustomerFile): Promise<CustomerFile> {
    const newFile: CustomerFile = {
      ...customerFile,
      id: this.currentCustomerFileId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customerFiles.set(newFile.id, newFile);
    return newFile;
  }

  async updateCustomerFile(id: number, tenantId: number, updates: Partial<InsertCustomerFile>): Promise<CustomerFile | undefined> {
    const file = this.customerFiles.get(id);
    if (!file || file.tenantId !== tenantId) return undefined;

    const updated: CustomerFile = {
      ...file,
      ...updates,
      updatedAt: new Date()
    };
    this.customerFiles.set(id, updated);
    return updated;
  }

  async deleteCustomerFile(id: number, tenantId: number): Promise<boolean> {
    const file = this.customerFiles.get(id);
    if (!file || file.tenantId !== tenantId) return false;
    
    return this.customerFiles.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  private sql: any;

  constructor() {
    // Initialize postgres connection using the same config as the rest of the app
    this.sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require'
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log("DatabaseStorage: Looking up user by email:", email);
      const [user] = await db.select().from(users).where(eq(users.email, email));
      console.log("DatabaseStorage: User found:", user ? "Yes" : "No");
      return user || undefined;
    } catch (error) {
      console.error("DatabaseStorage: Error in getUserByEmail:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Check if user with this email already exists
      const existing = await this.getUserByEmail(insertUser.email);
      if (existing) {
        return existing; // Return existing user instead of creating duplicate
      }
      
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error: any) {
      // If duplicate key error, try to return existing user
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        const existing = await this.getUserByEmail(insertUser.email);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant || undefined;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    try {
      // Check if tenant with this subdomain already exists
      if (tenant.subdomain) {
        const existing = await this.getTenantBySubdomain(tenant.subdomain);
        if (existing) {
          return existing; // Return existing tenant instead of creating duplicate
        }
      }
      
      const [newTenant] = await db
        .insert(tenants)
        .values(tenant)
        .returning();
      return newTenant;
    } catch (error: any) {
      // If duplicate key error, try to return existing tenant
      if (error.code === '23505' && error.constraint === 'tenants_subdomain_unique') {
        if (tenant.subdomain) {
          const existing = await this.getTenantBySubdomain(tenant.subdomain);
          if (existing) {
            return existing;
          }
        }
      }
      throw error;
    }
  }

  async updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, id))
      .returning();
    return tenant || undefined;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set(updates)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan || undefined;
  }

  async getTenantSubscription(tenantId: number): Promise<TenantSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId));
    return subscription || undefined;
  }

  async createTenantSubscription(subscription: InsertTenantSubscription): Promise<TenantSubscription> {
    const [newSubscription] = await db
      .insert(tenantSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateTenantSubscription(id: number, updates: Partial<InsertTenantSubscription>): Promise<TenantSubscription | undefined> {
    const [subscription] = await db
      .update(tenantSubscriptions)
      .set(updates)
      .where(eq(tenantSubscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  async getCustomersByTenant(tenantId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.tenantId, tenantId));
  }

  async getCustomer(id: number, tenantId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, tenantId: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(updates)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  async getLeadsByTenant(tenantId: number): Promise<Lead[]> {
    const results = await db
      .select({
        ...getTableColumns(leads),
        leadTypeName: leadTypes.name,
        leadTypeIcon: leadTypes.icon,
        leadTypeColor: leadTypes.color,
      })
      .from(leads)
      .leftJoin(leadTypes, eq(leads.leadTypeId, leadTypes.id))
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt));
    
    return results as any[];
  }

  async getLead(id: number, tenantId: number): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
    return lead || undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();
    return newLead;
  }

  async updateLead(id: number, tenantId: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set(updates)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  async updateLeadScore(id: number, tenantId: number, score: number, priority: string): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ score, priority })
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .returning();
    return updatedLead || undefined;
  }

  async getLeadsByPriority(tenantId: number, priority: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), eq(leads.priority, priority)))
      .orderBy(desc(leads.score));
  }

  async getTopScoredLeads(tenantId: number, limit: number = 10): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.score))
      .limit(limit);
  }

  async convertLeadToCustomer(leadId: number, tenantId: number): Promise<{ customer: Customer; leadId: number; convertedAt: string }> {
    try {
      // Get the lead data
      const lead = await this.getLead(leadId, tenantId);
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Check if lead is already converted
      if (lead.convertedToCustomerId) {
        throw new Error('Lead has already been converted to a customer');
      }
      
      // Create customer from lead data
      const customerData: InsertCustomer = {
        tenantId: lead.tenantId,
        name: lead.name, // Use the single name field
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        crmStatus: 'new',
        preferences: {
          source: lead.source,
          leadType: lead.leadTypeId,
          typeSpecificData: lead.typeSpecificData
        }
      };
      
      // Create the customer
      const customer = await this.createCustomer(customerData);
      
      // Update lead status and link to customer
      await this.updateLead(leadId, tenantId, {
        status: 'converted',
        convertedToCustomerId: customer.id
      });
      
      return {
        customer,
        leadId,
        convertedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error converting lead to customer:', error);
      throw error;
    }
  }

  // Service Providers
  async getServiceProvidersByTenant(tenantId: number): Promise<any[]> {
    return await db.select().from(serviceProviders).where(
      and(
        eq(serviceProviders.tenantId, tenantId),
        eq(serviceProviders.isActive, true)
      )
    );
  }

  async getServiceProvidersByLeadType(tenantId: number, leadTypeId: number): Promise<any[]> {
    return await db.select().from(serviceProviders).where(
      and(
        eq(serviceProviders.tenantId, tenantId),
        eq(serviceProviders.leadTypeId, leadTypeId),
        eq(serviceProviders.isActive, true)
      )
    );
  }

  async getServiceProvider(id: number, tenantId: number): Promise<any | undefined> {
    const [serviceProvider] = await db
      .select()
      .from(serviceProviders)
      .where(and(
        eq(serviceProviders.id, id), 
        eq(serviceProviders.tenantId, tenantId)
      ));
    return serviceProvider || undefined;
  }

  async createServiceProvider(serviceProvider: any): Promise<any> {
    const [newServiceProvider] = await db
      .insert(serviceProviders)
      .values(serviceProvider)
      .returning();
    return newServiceProvider;
  }

  async updateServiceProvider(id: number, tenantId: number, updates: any): Promise<any | undefined> {
    const [serviceProvider] = await db
      .update(serviceProviders)
      .set(updates)
      .where(and(
        eq(serviceProviders.id, id), 
        eq(serviceProviders.tenantId, tenantId)
      ))
      .returning();
    return serviceProvider || undefined;
  }

  async deleteServiceProvider(id: number, tenantId: number): Promise<boolean> {
    const [serviceProvider] = await db
      .update(serviceProviders)
      .set({ isActive: false })
      .where(and(
        eq(serviceProviders.id, id), 
        eq(serviceProviders.tenantId, tenantId)
      ))
      .returning();
    return !!serviceProvider;
  }
  // Package Types
  async getPackageTypesByTenant(tenantId: number): Promise<PackageType[]> {
    return await db.select().from(packageTypes).where(
      and(
        eq(packageTypes.tenantId, tenantId),
        eq(packageTypes.isDeleted, false)
      )
    );
  }

  async getPackageType(id: number, tenantId: number): Promise<PackageType | undefined> {
    const [packageType] = await db
      .select()
      .from(packageTypes)
      .where(and(
        eq(packageTypes.id, id), 
        eq(packageTypes.tenantId, tenantId),
        eq(packageTypes.isDeleted, false)
      ));
    return packageType || undefined;
  }

  async createPackageType(packageType: InsertPackageType): Promise<PackageType> {
    const [newPackageType] = await db
      .insert(packageTypes)
      .values(packageType)
      .returning();
    return newPackageType;
  }

  async updatePackageType(id: number, tenantId: number, updates: Partial<InsertPackageType>): Promise<PackageType | undefined> {
    const [packageType] = await db
      .update(packageTypes)
      .set(updates)
      .where(and(
        eq(packageTypes.id, id), 
        eq(packageTypes.tenantId, tenantId),
        eq(packageTypes.isDeleted, false)
      ))
      .returning();
    return packageType || undefined;
  }

  async deletePackageType(id: number, tenantId: number): Promise<boolean> {
    // Soft delete - set isDeleted to true instead of removing the record
    const result = await db
      .update(packageTypes)
      .set({ isDeleted: true })
      .where(and(
        eq(packageTypes.id, id), 
        eq(packageTypes.tenantId, tenantId),
        eq(packageTypes.isDeleted, false)
      ));
    return result.rowCount > 0;
  }

  async getTravelPackagesByTenant(tenantId: number): Promise<TravelPackage[]> {
    return await db.select().from(travelPackages).where(eq(travelPackages.tenantId, tenantId));
  }

  async getTravelPackage(id: number, tenantId: number): Promise<TravelPackage | undefined> {
    const [travelPackage] = await db
      .select()
      .from(travelPackages)
      .where(and(eq(travelPackages.id, id), eq(travelPackages.tenantId, tenantId)));
    return travelPackage || undefined;
  }

  async createTravelPackage(travelPackage: InsertTravelPackage): Promise<TravelPackage> {
    const [newPackage] = await db
      .insert(travelPackages)
      .values(travelPackage)
      .returning();
    return newPackage;
  }

  async updateTravelPackage(id: number, tenantId: number, updates: Partial<InsertTravelPackage>): Promise<TravelPackage | undefined> {
    const [travelPackage] = await db
      .update(travelPackages)
      .set(updates)
      .where(and(eq(travelPackages.id, id), eq(travelPackages.tenantId, tenantId)))
      .returning();
    return travelPackage || undefined;
  }

  async deleteTravelPackage(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(travelPackages)
      .where(and(eq(travelPackages.id, id), eq(travelPackages.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  async getBookingsByTenant(tenantId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.tenantId, tenantId));
  }

  async getBooking(id: number, tenantId: number): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.tenantId, tenantId)));
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async updateBooking(id: number, tenantId: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(and(eq(bookings.id, id), eq(bookings.tenantId, tenantId)))
      .returning();
    return booking || undefined;
  }

  async deleteBooking(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  async getTenantDashboardData(tenantId: number): Promise<any> {
    const [customerCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const [leadCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.tenantId, tenantId));

    const [bookingCount] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    const recentBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    const topPackages = await db
      .select()
      .from(travelPackages)
      .where(eq(travelPackages.tenantId, tenantId))
      .limit(5);

    return {
      metrics: {
        revenue: 45000,
        activeBookings: bookingCount.count,
        customers: customerCount.count,
        leads: leadCount.count,
      },
      recentBookings,
      topPackages,
    };
  }

  async getSaasDashboardData(): Promise<any> {
    const [tenantCount] = await db.select({ count: count() }).from(tenants);
    
    const recentTenants = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    return {
      totalTenants: tenantCount.count,
      monthlyRevenue: 125000,
      activeTrials: 15,
      growthRate: 12.5,
      recentTenants,
    };
  }

  // Social Media Integrations
  async getSocialIntegrationsByTenant(tenantId: number): Promise<SocialIntegration[]> {
    return await db
      .select()
      .from(socialIntegrations)
      .where(eq(socialIntegrations.tenantId, tenantId))
      .orderBy(desc(socialIntegrations.createdAt));
  }

  async getSocialIntegration(id: number, tenantId: number): Promise<SocialIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(eq(socialIntegrations.id, id), eq(socialIntegrations.tenantId, tenantId)));
    return integration || undefined;
  }

  async getSocialIntegrationByPlatform(platform: string, tenantId: number): Promise<SocialIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(eq(socialIntegrations.platform, platform), eq(socialIntegrations.tenantId, tenantId)));
    return integration || undefined;
  }

  async createSocialIntegration(integration: InsertSocialIntegration): Promise<SocialIntegration> {
    const [newIntegration] = await db
      .insert(socialIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async updateSocialIntegration(id: number, tenantId: number, updates: Partial<InsertSocialIntegration>): Promise<SocialIntegration | undefined> {
    const [integration] = await db
      .update(socialIntegrations)
      .set(updates)
      .where(and(eq(socialIntegrations.id, id), eq(socialIntegrations.tenantId, tenantId)))
      .returning();
    return integration || undefined;
  }

  async deleteSocialIntegration(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(socialIntegrations)
      .where(and(eq(socialIntegrations.id, id), eq(socialIntegrations.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // Email Campaigns
  async getEmailCampaignsByTenant(tenantId: number): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.tenantId, tenantId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number, tenantId: number): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.tenantId, tenantId)));
    return campaign || undefined;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateEmailCampaign(id: number, tenantId: number, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db
      .update(emailCampaigns)
      .set(updates)
      .where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteEmailCampaign(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(emailCampaigns)
      .where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  async getEmailCampaignStats(tenantId: number): Promise<any> {
    const campaigns = await this.getEmailCampaignsByTenant(tenantId);
    
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + (c.recipientCount || 0), 0);
    
    const sentCampaigns = campaigns.filter(c => c.status === 'sent' && c.openRate && c.clickRate);
    const avgOpenRate = sentCampaigns.length > 0 
      ? (sentCampaigns.reduce((sum, c) => sum + parseFloat(c.openRate || '0'), 0) / sentCampaigns.length).toFixed(1)
      : '0';
    const avgClickRate = sentCampaigns.length > 0 
      ? (sentCampaigns.reduce((sum, c) => sum + parseFloat(c.clickRate || '0'), 0) / sentCampaigns.length).toFixed(1)
      : '0';

    return {
      totalCampaigns,
      totalSent,
      avgOpenRate,
      avgClickRate
    };
  }

  async getEmailConfiguration(tenantId: number): Promise<EmailConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(emailConfigurations)
      .where(eq(emailConfigurations.tenantId, tenantId))
      .limit(1);
    return config || undefined;
  }

  async upsertEmailConfiguration(config: InsertEmailConfiguration): Promise<EmailConfiguration> {
    const existing = await this.getEmailConfiguration(config.tenantId);
    
    if (existing) {
      const [updated] = await db
        .update(emailConfigurations)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(emailConfigurations.tenantId, config.tenantId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(emailConfigurations)
        .values(config)
        .returning();
      return created;
    }
  }

  // Estimates
  async getEstimatesByTenant(tenantId: number): Promise<Estimate[]> {
    console.log("🔍 DatabaseStorage: Getting estimates for tenant:", tenantId);
    return await db
      .select()
      .from(estimates)
      .where(eq(estimates.tenantId, tenantId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimate(id: number, tenantId: number): Promise<Estimate | undefined> {
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.tenantId, tenantId)));
    return estimate || undefined;
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await db
      .insert(estimates)
      .values(estimate)
      .returning();
    return newEstimate;
  }

  async updateEstimate(id: number, tenantId: number, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const [updated] = await db
      .update(estimates)
      .set(updates)
      .where(and(eq(estimates.id, id), eq(estimates.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteEstimate(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // Estimate Line Items
  async getEstimateLineItems(estimateId: number): Promise<EstimateLineItem[]> {
    return await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId))
      .orderBy(estimateLineItems.displayOrder);
  }

  async createEstimateLineItem(lineItem: InsertEstimateLineItem): Promise<EstimateLineItem> {
    const [newLineItem] = await db
      .insert(estimateLineItems)
      .values(lineItem)
      .returning();
    return newLineItem;
  }

  async updateEstimateLineItem(id: number, updates: Partial<InsertEstimateLineItem>): Promise<EstimateLineItem | undefined> {
    const [updated] = await db
      .update(estimateLineItems)
      .set(updates)
      .where(eq(estimateLineItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEstimateLineItem(id: number): Promise<boolean> {
    const result = await db
      .delete(estimateLineItems)
      .where(eq(estimateLineItems.id, id));
    return result.rowCount > 0;
  }

  // Estimate Email Logs
  async createEstimateEmailLog(emailLog: InsertEstimateEmailLog): Promise<EstimateEmailLog> {
    const [newEmailLog] = await db
      .insert(estimateEmailLogs)
      .values(emailLog)
      .returning();
    return newEmailLog;
  }

  async getEstimateEmailLogs(estimateId: number): Promise<EstimateEmailLog[]> {
    return await db
      .select()
      .from(estimateEmailLogs)
      .where(eq(estimateEmailLogs.estimateId, estimateId))
      .orderBy(desc(estimateEmailLogs.sentAt));
  }

  // Call Logs
  async getCallLogsByTenant(tenantId: number): Promise<CallLog[]> {
    return await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.tenantId, tenantId))
      .orderBy(desc(callLogs.startedAt));
  }

  async getCallLogsByCustomer(customerId: number, tenantId: number): Promise<CallLog[]> {
    return await db
      .select()
      .from(callLogs)
      .where(and(eq(callLogs.customerId, customerId), eq(callLogs.tenantId, tenantId)))
      .orderBy(desc(callLogs.startedAt));
  }

  async getCallLog(id: number, tenantId: number): Promise<CallLog | undefined> {
    const [callLog] = await db
      .select()
      .from(callLogs)
      .where(and(eq(callLogs.id, id), eq(callLogs.tenantId, tenantId)));
    return callLog || undefined;
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const [newCallLog] = await db
      .insert(callLogs)
      .values(callLog)
      .returning();
    return newCallLog;
  }

  async updateCallLog(id: number, tenantId: number, updates: Partial<InsertCallLog>): Promise<CallLog | undefined> {
    const [updated] = await db
      .update(callLogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(callLogs.id, id), eq(callLogs.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteCallLog(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(callLogs)
      .where(and(eq(callLogs.id, id), eq(callLogs.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // Customer Files
  async getCustomerFilesByCustomer(customerId: number, tenantId: number): Promise<CustomerFile[]> {
    return await db
      .select()
      .from(customerFiles)
      .where(and(eq(customerFiles.customerId, customerId), eq(customerFiles.tenantId, tenantId)))
      .orderBy(desc(customerFiles.createdAt));
  }

  async getCustomerFile(id: number, tenantId: number): Promise<CustomerFile | undefined> {
    const [file] = await db
      .select()
      .from(customerFiles)
      .where(and(eq(customerFiles.id, id), eq(customerFiles.tenantId, tenantId)));
    return file || undefined;
  }

  async createCustomerFile(customerFile: InsertCustomerFile): Promise<CustomerFile> {
    const [newFile] = await db
      .insert(customerFiles)
      .values(customerFile)
      .returning();
    return newFile;
  }

  async updateCustomerFile(id: number, tenantId: number, updates: Partial<InsertCustomerFile>): Promise<CustomerFile | undefined> {
    const [updated] = await db
      .update(customerFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customerFiles.id, id), eq(customerFiles.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteCustomerFile(id: number, tenantId: number): Promise<boolean> {
    const result = await db
      .delete(customerFiles)
      .where(and(eq(customerFiles.id, id), eq(customerFiles.tenantId, tenantId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
