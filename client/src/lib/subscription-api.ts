// Direct subscription API client with fallback data
export class SubscriptionAPIClient {
  private static baseURL = '/api';

  static async getPlans() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/plans`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // New structure: array of country groups with plans inside
        if (Array.isArray(data) && data.length > 0 && data[0].country) {
          // Flatten the grouped structure for backward compatibility
          const allPlans: any[] = [];
          data.forEach((countryGroup: any) => {
            if (countryGroup.plans && Array.isArray(countryGroup.plans)) {
              countryGroup.plans.forEach((plan: any) => {
                allPlans.push({
                  id: plan.id,
                  name: plan.name,
                  description: plan.description,
                  monthlyPrice: plan.monthly_price?.replace('.00', '') || plan.monthlyPrice,
                  yearlyPrice: plan.yearly_price?.replace('.00', '') || plan.yearlyPrice,
                  maxUsers: plan.max_users || plan.maxUsers,
                  maxCustomers: plan.max_customers || plan.maxCustomers,
                  features: plan.features || [],
                  isActive: plan.is_active !== undefined ? plan.is_active : plan.isActive,
                  country: plan.country || countryGroup.country || 'US',
                  currency: plan.currency || countryGroup.currency || 'USD',
                  allowed_menu_items: plan.allowed_menu_items || [],
                  allowed_pages: plan.allowed_pages || [],
                  free_trial_days: plan.free_trial_days || 0,
                  is_free_plan: plan.is_free_plan || false,
                  allowed_dashboard_widgets: plan.allowed_dashboard_widgets || [],
                  allowed_page_permissions: plan.allowed_page_permissions || {}
                });
              });
            }
          });
          return allPlans;
        }
        // Fallback for old structure (flat array)
        if (Array.isArray(data)) {
          return data.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            monthlyPrice: plan.monthly_price?.replace('.00', '') || plan.monthlyPrice,
            yearlyPrice: plan.yearly_price?.replace('.00', '') || plan.yearlyPrice,
            maxUsers: plan.max_users || plan.maxUsers,
            maxCustomers: plan.max_customers || plan.maxCustomers,
            features: plan.features || [],
            isActive: plan.is_active !== undefined ? plan.is_active : plan.isActive,
            country: plan.country || 'US',
            currency: plan.currency || 'USD'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
    
    return [];
  }

  // New method to get plans grouped by country
  static async getPlansGroupedByCountry() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/plans`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Return the grouped structure as-is
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error('Error fetching subscription plans grouped by country:', error);
    }
    
    return [];
  }

  static async getCurrentSubscription() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          // Transform API response to match frontend expectations
          return {
            subscription: {
              id: data.subscription.id,
              planId: data.subscription.plan_id || data.subscription.planId,
              status: data.subscription.status,
              billingCycle: data.subscription.billing_cycle || data.subscription.billingCycle,
              trialEndsAt: data.subscription.trial_ends_at || data.subscription.trialEndsAt,
              nextBillingDate: data.subscription.next_billing_date || data.subscription.nextBillingDate,
              paymentGateway: data.subscription.payment_gateway || data.subscription.paymentGateway
            },
            onTrial: data.onTrial,
            trialDaysLeft: data.trialDaysLeft
          };
        }
        return data;
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
    
    return { subscription: null, onTrial: false, trialDaysLeft: 0 };
  }

  static async createSubscription(data: {
    planId: number;
    billingCycle: string;
    paymentGateway: string;
    paymentMethodId?: string;
  }) {
    const response = await fetch(`${this.baseURL}/subscription/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }
    
    return await response.json();
  }

  static async cancelSubscription() {
    const response = await fetch(`${this.baseURL}/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }
    
    return await response.json();
  }

  static async getPaymentMethods() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.log('No payment methods available');
    }
    
    return [];
  }

  static async getPaymentHistory() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/payment-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.log('No payment history available');
    }
    
    return [];
  }
}