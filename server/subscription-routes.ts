import { Express } from 'express';
import { simpleStorage } from './simple-storage';
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
      
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
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

      console.log('Creating subscription for tenant:', user.tenantId, 'plan:', planId);
      
      res.setHeader('Content-Type', 'application/json');

      if (!planId || !billingCycle || !paymentGateway) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create trial subscription
      const subscriptionData = {
        tenantId: user.tenantId,
        planId: parseInt(planId),
        status: 'trial',
        billingCycle,
        paymentGateway,
        gatewaySubscriptionId: 'sub_' + Math.random().toString(36).substr(2, 9),
        gatewayCustomerId: 'cust_' + Math.random().toString(36).substr(2, 9),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        failedPaymentAttempts: 0
      };

      const result = await simpleStorage.createTenantSubscription(subscriptionData);

      res.json({
        subscriptionId: result.gatewaySubscriptionId,
        status: 'trial',
        trialEndsAt: result.trialEndsAt,
        nextBillingDate: result.nextBillingDate
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
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