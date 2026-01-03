import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { simpleStorage } from './simple-storage';

// Lazy initialization of payment gateways (only when needed)
let stripeInstance: Stripe | null = null;
let razorpayInstance: Razorpay | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripeInstance;
}

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    // Support both RAZORPAY_SECRET and RAZORPAY_KEY_SECRET for compatibility
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      const missing = [];
      if (!keyId) missing.push('RAZORPAY_KEY_ID');
      if (!keySecret) missing.push('RAZORPAY_SECRET or RAZORPAY_KEY_SECRET');
      throw new Error(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not configured in environment variables. Please check your .env file and restart the server.`);
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

export interface SubscriptionData {
  tenantId: number;
  planId: number;
  billingCycle: 'monthly' | 'yearly';
  paymentGateway: 'stripe' | 'razorpay';
  paymentMethodId?: string;
  customerInfo: {
    email: string;
    name: string;
    phone?: string;
  };
}

export interface PaymentMethodData {
  tenantId: number;
  paymentGateway: 'stripe' | 'razorpay';
  token: string;
  isDefault?: boolean;
}

export class SubscriptionService {
  // Create recurring subscription with Stripe
  async createStripeSubscription(data: SubscriptionData) {
    try {
      // Get subscription plan details
      const plans = await simpleStorage.getAllSubscriptionPlans();
      const plan = plans.find(p => p.id === data.planId);
      if (!plan) throw new Error('Subscription plan not found');

      const stripe = getStripe();

      // Create or get Stripe customer
      let stripeCustomer;
      const existingSubscription = await simpleStorage.getTenantSubscription(data.tenantId);
      
      if (existingSubscription?.gatewayCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(existingSubscription.gatewayCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: data.customerInfo.email,
          name: data.customerInfo.name,
          phone: data.customerInfo.phone,
          metadata: {
            tenantId: data.tenantId.toString(),
          },
        });
      }

      // Attach payment method to customer if provided
      if (data.paymentMethodId) {
        await stripe.paymentMethods.attach(data.paymentMethodId, {
          customer: stripeCustomer.id,
        });
        
        // Set as default payment method
        await stripe.customers.update(stripeCustomer.id, {
          invoice_settings: {
            default_payment_method: data.paymentMethodId,
          },
        });
      }

      // Create Stripe product and price if not exists
      const productId = `travel_crm_plan_${data.planId}`;
      let product;
      
      try {
        product = await stripe.products.retrieve(productId);
      } catch {
        product = await stripe.products.create({
          id: productId,
          name: plan.name,
          description: plan.description || '',
          metadata: {
            planId: data.planId.toString(),
          },
        });
      }

      // Create price for the billing cycle
      const amount = data.billingCycle === 'monthly' 
        ? Math.round(parseFloat(plan.monthlyPrice) * 100)
        : Math.round(parseFloat(plan.yearlyPrice) * 100);

      const priceId = `${productId}_${data.billingCycle}`;
      let price;

      try {
        price = await stripe.prices.retrieve(priceId);
      } catch {
        price = await stripe.prices.create({
          id: priceId,
          unit_amount: amount,
          currency: 'usd',
          recurring: {
            interval: data.billingCycle === 'monthly' ? 'month' : 'year',
          },
          product: product.id,
        });
      }

      // Create subscription with payment method attached
      const subscriptionParams: any = {
        customer: stripeCustomer.id,
        items: [{ price: price.id }],
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 14, // 14-day trial
        metadata: {
          tenantId: data.tenantId.toString(),
          planId: data.planId.toString(),
        },
      };

      // If payment method is provided, use it; otherwise create incomplete subscription
      if (data.paymentMethodId) {
        subscriptionParams.default_payment_method = data.paymentMethodId;
        subscriptionParams.payment_behavior = 'default_incomplete';
        subscriptionParams.payment_settings = {
          save_default_payment_method: 'on_subscription',
        };
      } else {
        // If no payment method, subscription will be incomplete and require payment method later
        subscriptionParams.payment_behavior = 'default_incomplete';
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Calculate trial and billing dates
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      const nextBillingDate = new Date(subscription.current_period_end * 1000);

      // Save subscription to database
      const subscriptionData = {
        tenantId: data.tenantId,
        planId: data.planId,
        status: 'trial',
        billingCycle: data.billingCycle,
        paymentGateway: 'stripe' as const,
        gatewaySubscriptionId: subscription.id,
        gatewayCustomerId: stripeCustomer.id,
        trialEndsAt,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd,
        nextBillingDate,
        failedPaymentAttempts: 0,
      };

      await simpleStorage.createTenantSubscription(subscriptionData);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status,
        trialEndsAt,
        nextBillingDate,
      };
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw error;
    }
  }

  // Create recurring subscription with Razorpay
  async createRazorpaySubscription(data: SubscriptionData) {
    try {
      // Get subscription plan details
      const plans = await simpleStorage.getAllSubscriptionPlans();
      const plan = plans.find(p => p.id === data.planId);
      if (!plan) throw new Error('Subscription plan not found');

      const razorpay = getRazorpay();
      
      // Check if customer already exists in database subscription
      let customer;
      const existingSubscription = await simpleStorage.getTenantSubscription(data.tenantId);
      
      if (existingSubscription?.gatewayCustomerId) {
        // Customer already exists, retrieve it
        try {
          customer = await razorpay.customers.fetch(existingSubscription.gatewayCustomerId);
        } catch (error: any) {
          // If customer doesn't exist in Razorpay, create new one
          console.log('Existing customer ID not found in Razorpay, creating new customer');
          customer = null;
        }
      }
      
      // Create new customer if doesn't exist
      if (!customer) {
        try {
          customer = await razorpay.customers.create({
            name: data.customerInfo.name,
            email: data.customerInfo.email,
            contact: data.customerInfo.phone || '',
            fail_existing: 0, // Don't fail if customer exists, just return existing
          });
        } catch (error: any) {
          // Handle case where customer already exists
          if (error.statusCode === 400 && error.error?.description?.includes('already exists')) {
            console.log('Razorpay customer already exists. Attempting to find existing customer by email...');
            
            // First, check if we have customer ID in database
            const existingSub = await simpleStorage.getTenantSubscription(data.tenantId);
            if (existingSub?.gatewayCustomerId) {
              try {
                customer = await razorpay.customers.fetch(existingSub.gatewayCustomerId);
                console.log('Using existing customer from database:', customer.id);
              } catch (fetchError) {
                console.log('Customer ID from database not found in Razorpay, will search by email');
              }
            }
            
            // If still not found, try to list customers and find by email
            if (!customer) {
              try {
                console.log('Searching for customer by email in Razorpay...');
                // List customers (Razorpay doesn't support email search, so we list and filter)
                // Limit to first 100 customers to avoid performance issues
                const customersList = await razorpay.customers.all({ count: 100 });
                
                // Find customer with matching email
                const foundCustomer = customersList.items.find(
                  (c: any) => c.email && c.email.toLowerCase() === data.customerInfo.email.toLowerCase()
                );
                
                if (foundCustomer) {
                  customer = foundCustomer;
                  console.log('Found existing customer by email:', customer.id);
                  
                  // Update database with the found customer ID for future use
                  if (existingSub) {
                    await simpleStorage.updateTenantSubscription(existingSub.id, {
                      gatewayCustomerId: customer.id,
                    });
                    console.log('Updated database with customer ID:', customer.id);
                  }
                } else {
                  throw new Error('Customer exists in Razorpay but could not be found. Please contact support.');
                }
              } catch (searchError: any) {
                console.error('Error searching for customer:', searchError);
                throw new Error('Customer already exists in Razorpay but we could not retrieve it. Please contact support.');
              }
            }
          } else {
            throw error;
          }
        }
      }

      // Create Razorpay plan with recurring billing
      // Amount should be in smallest currency unit (paise for INR, cents for USD)
      const amount = data.billingCycle === 'monthly' 
        ? Math.round(parseFloat(plan.monthlyPrice) * 100)
        : Math.round(parseFloat(plan.yearlyPrice) * 100);

      // Razorpay plan configuration for recurring payments
      const period = data.billingCycle === 'monthly' ? 'monthly' : 'yearly';
      const interval = data.billingCycle === 'monthly' ? 1 : 12; // 1 month or 12 months
      const currency = plan.currency?.toUpperCase() || 'INR';

      // Razorpay plan creation
      // According to Razorpay API: item should have 'amount' (not unit_amount) and 'currency'
      const razorpayPlan = await razorpay.plans.create({
        period, // 'monthly' or 'yearly'
        interval, // 1 for monthly, 12 for yearly
        item: {
          name: plan.name,
          amount: amount, // Amount in smallest currency unit (paise for INR, cents for USD)
          currency: currency, // Currency code (INR, USD, etc.)
          description: plan.description || '',
        },
      });

      // Create recurring subscription with trial period
      // total_count: null = infinite recurring (continues until cancelled)
      // start_at: Trial end date (14 days from now) - first payment happens after trial
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        customer_id: customer.id,
        total_count: null, // null = infinite recurring, continues monthly/yearly until cancelled
        quantity: 1,
        start_at: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // Start billing after 14-day trial
        addons: [],
        notes: {
          tenantId: data.tenantId.toString(),
          planId: data.planId.toString(),
          billingCycle: data.billingCycle, // Store billing cycle in notes for reference
        },
      });

      // Calculate trial and billing dates
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const nextBillingDate = new Date(subscription.start_at * 1000);
      const currentPeriodEnd = new Date(subscription.start_at * 1000);

      // Save subscription to database
      const subscriptionData = {
        tenantId: data.tenantId,
        planId: data.planId,
        status: 'trial',
        billingCycle: data.billingCycle,
        paymentGateway: 'razorpay' as const,
        gatewaySubscriptionId: subscription.id,
        gatewayCustomerId: customer.id,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        nextBillingDate,
        failedPaymentAttempts: 0,
      };

      await simpleStorage.createTenantSubscription(subscriptionData);

      return {
        subscriptionId: subscription.id,
        customerId: customer.id,
        status: subscription.status,
        trialEndsAt,
        nextBillingDate,
      };
    } catch (error) {
      console.error('Razorpay subscription creation error:', error);
      throw error;
    }
  }

  // Add payment method for Stripe
  async addStripePaymentMethod(data: PaymentMethodData) {
    try {
      const subscription = await simpleStorage.getTenantSubscription(data.tenantId);
      if (!subscription || !subscription.gatewayCustomerId) {
        throw new Error('Customer not found');
      }

      const stripe = getStripe();

      // Attach payment method to customer
      await stripe.paymentMethods.attach(data.token, {
        customer: subscription.gatewayCustomerId,
      });

      // Get payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(data.token);

      // Set as default if specified
      if (data.isDefault) {
        await stripe.customers.update(subscription.gatewayCustomerId, {
          invoice_settings: {
            default_payment_method: data.token,
          },
        });
      }

      // Save to database
      const methodData = {
        tenantId: data.tenantId,
        paymentGateway: 'stripe' as const,
        gatewayMethodId: data.token,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4 || null,
        brand: paymentMethod.card?.brand || null,
        expiryMonth: paymentMethod.card?.exp_month || null,
        expiryYear: paymentMethod.card?.exp_year || null,
        isDefault: data.isDefault || false,
        isActive: true,
      };

      await simpleStorage.createPaymentMethod(methodData);

      return methodData;
    } catch (error) {
      console.error('Stripe payment method error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(tenantId: number) {
    try {
      const subscription = await simpleStorage.getTenantSubscription(tenantId);
      if (!subscription) throw new Error('Subscription not found');

      if (subscription.paymentGateway === 'stripe') {
        const stripe = getStripe();
        await stripe.subscriptions.update(subscription.gatewaySubscriptionId!, {
          cancel_at_period_end: true,
        });
      } else if (subscription.paymentGateway === 'razorpay') {
        const razorpay = getRazorpay();
        await razorpay.subscriptions.cancel(subscription.gatewaySubscriptionId!, {
          cancel_at_cycle_end: 1,
        });
      }

      // Update database
      await simpleStorage.updateTenantSubscription(subscription.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleStripePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleStripePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
      }
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  async handleRazorpayWebhook(event: any) {
    try {
      switch (event.event) {
        case 'subscription.charged':
          await this.handleRazorpayPaymentSucceeded(event.payload.subscription.entity);
          break;
        case 'subscription.halted':
          await this.handleRazorpayPaymentFailed(event.payload.subscription.entity);
          break;
        case 'subscription.cancelled':
          await this.handleRazorpaySubscriptionCancelled(event.payload.subscription.entity);
          break;
      }
    } catch (error) {
      console.error('Razorpay webhook error:', error);
      throw error;
    }
  }

  private async handleStripePaymentSucceeded(invoice: Stripe.Invoice) {
    // Try to get tenantId from subscription metadata
    let tenantId = 0;
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      try {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        tenantId = parseInt(subscription.metadata?.tenantId || '0');
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
    
    // Fallback: try invoice metadata
    if (!tenantId && invoice.metadata?.tenantId) {
      tenantId = parseInt(invoice.metadata.tenantId);
    }
    
    if (!tenantId) {
      console.warn('Could not determine tenantId from invoice:', invoice.id);
      return;
    }

    // Record payment history
    await simpleStorage.createPaymentHistory({
      tenantId,
      subscriptionId: 0, // Will be updated
      paymentGateway: 'stripe',
      gatewayPaymentId: invoice.payment_intent as string,
      amount: (invoice.amount_paid / 100).toString(),
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      paymentMethod: 'card',
      receiptUrl: invoice.hosted_invoice_url,
    });

    // Update subscription status
    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: 'active',
        lastPaymentDate: new Date(),
        failedPaymentAttempts: 0,
      });
    }
  }

  private async handleStripePaymentFailed(invoice: Stripe.Invoice) {
    // Try to get tenantId from subscription metadata
    let tenantId = 0;
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      try {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        tenantId = parseInt(subscription.metadata?.tenantId || '0');
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
    
    // Fallback: try invoice metadata
    if (!tenantId && invoice.metadata?.tenantId) {
      tenantId = parseInt(invoice.metadata.tenantId);
    }
    
    if (!tenantId) {
      console.warn('Could not determine tenantId from invoice:', invoice.id);
      return;
    }

    const subscription = await simpleStorage.getTenantSubscription(tenantId);
    if (subscription) {
      const failedAttempts = (subscription.failedPaymentAttempts || 0) + 1;
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: failedAttempts >= 3 ? 'past_due' : 'active',
        failedPaymentAttempts: failedAttempts,
      });
    }
  }

  private async handleStripeSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = parseInt(subscription.metadata.tenantId || '0');
    if (!tenantId) return;

    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: subscription.status === 'active' ? 'active' : subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      });
    }
  }

  private async handleStripeSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = parseInt(subscription.metadata.tenantId || '0');
    if (!tenantId) return;

    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });
    }
  }

  private async handleRazorpayPaymentSucceeded(subscription: any) {
    const tenantId = parseInt(subscription.notes?.tenantId || '0');
    if (!tenantId) return;

    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: 'active',
        lastPaymentDate: new Date(),
        failedPaymentAttempts: 0,
      });
    }
  }

  private async handleRazorpayPaymentFailed(subscription: any) {
    const tenantId = parseInt(subscription.notes?.tenantId || '0');
    if (!tenantId) return;

    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      const failedAttempts = (dbSubscription.failedPaymentAttempts || 0) + 1;
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: failedAttempts >= 3 ? 'past_due' : 'active',
        failedPaymentAttempts: failedAttempts,
      });
    }
  }

  private async handleRazorpaySubscriptionCancelled(subscription: any) {
    const tenantId = parseInt(subscription.notes?.tenantId || '0');
    if (!tenantId) return;

    const dbSubscription = await simpleStorage.getTenantSubscription(tenantId);
    if (dbSubscription) {
      await simpleStorage.updateTenantSubscription(dbSubscription.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });
    }
  }
}

export const subscriptionService = new SubscriptionService();