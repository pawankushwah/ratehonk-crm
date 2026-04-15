import { Express } from 'express';
import { simpleStorage } from './simple-storage.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Secure authentication middleware
async function authenticateToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await simpleStorage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function registerSubscriptionRoutes(app: Express) {
  // Get all subscription plans
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      console.log('Fetching subscription plans...');
      res.setHeader('Content-Type', 'application/json');
      
      const plans = await simpleStorage.getAllSubscriptionPlans();
      console.log('Found plans:', plans.length);
      
      // Group plans by country
      const plansByCountry: Record<string, any[]> = {};
      
      plans.forEach((plan: any) => {
        const country = plan.country || 'US';
        if (!plansByCountry[country]) {
          plansByCountry[country] = [];
        }
        plansByCountry[country].push(plan);
      });
      
      // Transform to the desired structure
      const result = Object.keys(plansByCountry).map((country) => {
        const countryPlans = plansByCountry[country];
        const firstPlan = countryPlans[0];
        
        return {
          country: country,
          currency: firstPlan.currency || 'USD',
          plans: countryPlans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            monthly_price: plan.monthly_price,
            yearly_price: plan.yearly_price,
            max_users: plan.max_users,
            max_customers: plan.max_customers,
            features: plan.features,
            is_active: plan.is_active,
            created_at: plan.created_at,
            country: plan.country,
            currency: plan.currency,
            allowed_menu_items: plan.allowed_menu_items || [],
            allowed_pages: plan.allowed_pages || [],
            free_trial_days: plan.free_trial_days || 0,
            is_free_plan: plan.is_free_plan || false,
            allowed_dashboard_widgets: plan.allowed_dashboard_widgets || [],
            allowed_page_permissions: plan.allowed_page_permissions || {}
          }))
        };
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
  });

  // Get single subscription plan by ID (for editing)
  app.get('/api/subscription/plans/:planId', async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      if (isNaN(planId)) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      console.log('Fetching subscription plan by ID:', planId);
      res.setHeader('Content-Type', 'application/json');
      
      const plan = await simpleStorage.getSubscriptionPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      // Return plan with all fields
      res.json({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        monthly_price: plan.monthly_price,
        yearly_price: plan.yearly_price,
        max_users: plan.max_users,
        max_customers: plan.max_customers,
        features: plan.features,
        is_active: plan.is_active,
        created_at: plan.created_at,
        country: plan.country,
        currency: plan.currency,
        allowed_menu_items: plan.allowed_menu_items || [],
        allowed_pages: plan.allowed_pages || [],
        free_trial_days: plan.free_trial_days || 0,
        is_free_plan: plan.is_free_plan || false,
        allowed_dashboard_widgets: plan.allowed_dashboard_widgets || [],
        allowed_page_permissions: plan.allowed_page_permissions || {}
      });
    } catch (error) {
      console.error('Error fetching subscription plan by ID:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plan' });
    }
  });

  // Get current subscription
  app.get('/api/subscription/current', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('Fetching current subscription for tenant:', user.tenantId);
      
      res.setHeader('Content-Type', 'application/json');
      
      const subscription = await simpleStorage.getTenantSubscription(user.tenantId);
      
      if (!subscription) {
        return res.json({ 
          subscription: null, 
          onTrial: false, 
          trialDaysLeft: 0 
        });
      }

      const isOnTrial = subscription.status === 'trial' && 
                       subscription.trialEndsAt && 
                       new Date(subscription.trialEndsAt) > new Date();

      const trialDaysLeft = isOnTrial ? 
        Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

      res.json({
        subscription,
        onTrial: isOnTrial,
        trialDaysLeft
      });
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      res.status(500).json({ error: 'Failed to fetch current subscription' });
    }
  });

  // Create new subscription
  app.post('/api/subscription/create', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const { planId, billingCycle, paymentGateway, paymentMethodId } = req.body;

      console.log('Creating subscription for tenant:', user.tenantId, 'plan:', planId, 'gateway:', paymentGateway);
      
      res.setHeader('Content-Type', 'application/json');

      if (!planId || !billingCycle || !paymentGateway) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get user details for payment gateway (user object already has the data from authenticateToken)
      const userDetails = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: (user as any).phone,
      };

      // Get tenant details
      const tenant = await simpleStorage.getTenantById(user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Import subscription service
      const { SubscriptionService } = await import("./subscription-service.js");
      const subscriptionService = new SubscriptionService();

      let result;
      
      if (paymentGateway === 'stripe') {
        // For Stripe, payment method is REQUIRED
        if (!paymentMethodId) {
          return res.status(400).json({ 
            error: 'Payment method is required for Stripe subscriptions. Please add a payment method first.' 
          });
        }

        // Create REAL Stripe subscription with trial
        result = await subscriptionService.createStripeSubscription({
          tenantId: user.tenantId,
          planId: parseInt(planId),
          billingCycle: billingCycle as 'monthly' | 'yearly',
          paymentGateway: 'stripe',
          paymentMethodId,
          customerInfo: {
            email: userDetails.email || tenant.contact_email || '',
            name: `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || tenant.company_name || 'Customer',
            phone: userDetails.phone || tenant.contact_phone || undefined,
          },
        });
      } else if (paymentGateway === 'razorpay') {
        // For Razorpay, create subscription
        result = await subscriptionService.createRazorpaySubscription({
          tenantId: user.tenantId,
          planId: parseInt(planId),
          billingCycle: billingCycle as 'monthly' | 'yearly',
          paymentGateway: 'razorpay',
          customerInfo: {
            email: userDetails.email || tenant.contact_email || '',
            name: `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || tenant.company_name || 'Customer',
            phone: userDetails.phone || tenant.contact_phone || undefined,
          },
        });
      } else {
        return res.status(400).json({ error: 'Invalid payment gateway' });
      }

      res.json({
        subscriptionId: result.subscriptionId,
        status: 'trial',
        trialEndsAt: result.trialEndsAt,
        nextBillingDate: result.nextBillingDate,
        clientSecret: result.clientSecret, // For Stripe payment confirmation
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ 
        error: 'Failed to create subscription',
        details: error.message 
      });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('Cancelling subscription for tenant:', user.tenantId);
      
      res.setHeader('Content-Type', 'application/json');
      
      const subscription = await simpleStorage.getTenantSubscription(user.tenantId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      await simpleStorage.updateTenantSubscription(subscription.id, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Subscription cancelled successfully' 
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Get payment methods
  app.get('/api/subscription/payment-methods', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('Fetching payment methods for tenant:', user.tenantId);
      
      res.setHeader('Content-Type', 'application/json');
      
      const methods = await simpleStorage.getPaymentMethods(user.tenantId);
      res.json(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });

  // Get payment history
  app.get('/api/subscription/payment-history', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('Fetching payment history for tenant:', user.tenantId);
      
      res.setHeader('Content-Type', 'application/json');
      
      const history = await simpleStorage.getPaymentHistory(user.tenantId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  });
}