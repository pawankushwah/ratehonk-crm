import { simpleStorage } from "./simple-storage.js";

// Direct API handlers for subscription functionality
export class SubscriptionAPI {
  static async getPlans() {
    try {
      const plans = await simpleStorage.getAllSubscriptionPlans();
      return plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  static async getCurrentSubscription(tenantId: number) {
    try {
      const subscription = await simpleStorage.getTenantSubscription(tenantId);
      
      if (!subscription) {
        return { subscription: null, onTrial: false, trialDaysLeft: 0 };
      }

      const isOnTrial = subscription.status === 'trial' && 
                       subscription.trialEndsAt && 
                       new Date(subscription.trialEndsAt) > new Date();

      return {
        subscription,
        onTrial: isOnTrial,
        trialDaysLeft: isOnTrial ? 
          Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
      };
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return { subscription: null, onTrial: false, trialDaysLeft: 0 };
    }
  }

  static async createSubscription(data: {
    tenantId: number;
    planId: number;
    billingCycle: string;
    paymentGateway: string;
    paymentMethodId?: string;
  }) {
    try {
      // Create subscription record
      const subscriptionData = {
        tenantId: data.tenantId,
        planId: data.planId,
        status: 'trial',
        billingCycle: data.billingCycle,
        paymentGateway: data.paymentGateway,
        gatewaySubscriptionId: 'sub_' + Math.random().toString(36).substr(2, 9),
        gatewayCustomerId: 'cust_' + Math.random().toString(36).substr(2, 9),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        failedPaymentAttempts: 0
      };

      const result = await simpleStorage.createTenantSubscription(subscriptionData);
      
      return {
        subscriptionId: result.gatewaySubscriptionId,
        status: 'trial',
        trialEndsAt: result.trialEndsAt,
        nextBillingDate: result.nextBillingDate
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(tenantId: number) {
    try {
      const subscription = await simpleStorage.getTenantSubscription(tenantId);
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await simpleStorage.updateTenantSubscription(subscription.id, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      return { success: true, message: "Subscription cancelled successfully" };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  static async getPaymentMethods(tenantId: number) {
    try {
      return await simpleStorage.getPaymentMethods(tenantId);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  static async getPaymentHistory(tenantId: number) {
    try {
      return await simpleStorage.getPaymentHistory(tenantId);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}