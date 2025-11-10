import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { simpleStorage } from './simple-storage';

// Payment gateway configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_SECRET || '',
});

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

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 14, // 14-day trial
        metadata: {
          tenantId: data.tenantId.toString(),
          planId: data.planId.toString(),
        },
      });

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

      // Create Razorpay customer
      const customer = await razorpay.customers.create({
        name: data.customerInfo.name,
        email: data.customerInfo.email,
        contact: data.customerInfo.phone || '',
        fail_existing: 0,
      });

      // Create Razorpay plan
      const amount = data.billingCycle === 'monthly' 
        ? Math.round(parseFloat(plan.monthlyPrice) * 100)
        : Math.round(parseFloat(plan.yearlyPrice) * 100);

      const period = data.billingCycle === 'monthly' ? 'monthly' : 'yearly';
      const interval = data.billingCycle === 'monthly' ? 1 : 12;

      const razorpayPlan = await razorpay.plans.create({
        period,
        interval,
        item: {
          name: plan.name,
          amount,
          currency: 'INR',
          description: plan.description || '',
        },
      });

      // Create subscription with trial period
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        customer_id: customer.id,
        total_count: 120, // 10 years worth of payments
        quantity: 1,
        start_at: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // Start after 14-day trial
        addons: [],
        notes: {
          tenantId: data.tenantId.toString(),
          planId: data.planId.toString(),
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
        await stripe.subscriptions.update(subscription.gatewaySubscriptionId!, {
          cancel_at_period_end: true,
        });
      } else if (subscription.paymentGateway === 'razorpay') {
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
    const tenantId = parseInt(invoice.subscription_details?.metadata?.tenantId || '0');
    if (!tenantId) return;

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
    const subscription = await simpleStorage.getTenantSubscription(tenantId);
    if (subscription) {
      await simpleStorage.updateTenantSubscription(subscription.id, {
        status: 'active',
        lastPaymentDate: new Date(),
        failedPaymentAttempts: 0,
      });
    }
  }

  private async handleStripePaymentFailed(invoice: Stripe.Invoice) {
    const tenantId = parseInt(invoice.subscription_details?.metadata?.tenantId || '0');
    if (!tenantId) return;

    const subscription = await simpleStorage.getTenantSubscription(tenantId);
    if (subscription) {
      const failedAttempts = (subscription.failedPaymentAttempts || 0) + 1;
      await simpleStorage.updateTenantSubscription(subscription.id, {
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