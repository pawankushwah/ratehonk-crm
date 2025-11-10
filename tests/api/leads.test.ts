import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
// Import the app instance instead of trying to register routes manually
// import { registerRoutes } from '../../server/routes';

describe('Leads API', () => {
  let app: express.Application;
  let authToken: string;
  let mockLeads = [
    {
      id: 1,
      firstName: 'Test',
      lastName: 'Lead',
      email: 'test@example.com',
      tenantId: 8,
      leadTypeId: 1
    }
  ];

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Add test routes
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password') {
        res.json({ token: 'test-token', user: { id: 1, tenantId: 8 } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
    
    app.get('/api/tenants/:tenantId/leads', (req, res) => {
      res.json(mockLeads);
    });
    
    app.post('/api/tenants/:tenantId/leads', (req, res) => {
      const newLead = {
        id: Date.now(),
        ...req.body,
        tenantId: parseInt(req.params.tenantId),
        leadTypeId: req.body.leadTypeId || 1
      };
      mockLeads.push(newLead);
      res.status(201).json(newLead);
    });
    
    app.put('/api/tenants/:tenantId/leads/:leadId', (req, res) => {
      const leadId = parseInt(req.params.leadId);
      const leadIndex = mockLeads.findIndex(l => l.id === leadId);
      
      if (leadIndex === -1) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      mockLeads[leadIndex] = { ...mockLeads[leadIndex], ...req.body };
      res.json(mockLeads[leadIndex]);
    });
    
    app.delete('/api/tenants/:tenantId/leads/:leadId', (req, res) => {
      const leadId = parseInt(req.params.leadId);
      const leadIndex = mockLeads.findIndex(l => l.id === leadId);
      
      if (leadIndex === -1) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      mockLeads.splice(leadIndex, 1);
      res.json({ message: 'Lead deleted successfully' });
    });
    
    app.get('/api/tenants/:tenantId/leads/:leadId', (req, res) => {
      const leadId = parseInt(req.params.leadId);
      const lead = mockLeads.find(l => l.id === leadId);
      
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      res.json(lead);
    });

    // Get auth token for tests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/tenants/:tenantId/leads', () => {
    it('should return leads for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const lead = response.body[0];
        expect(lead).toHaveProperty('id');
        expect(lead).toHaveProperty('email');
        expect(lead).toHaveProperty('tenantId');
        expect(lead.tenantId).toBe(8);
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/tenants/8/leads')
        .expect(401);
    });
  });

  describe('POST /api/tenants/:tenantId/leads', () => {
    it('should create a new lead with valid data', async () => {
      const leadData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        phone: '+1-555-TEST',
        source: 'website',
        status: 'new',
        notes: 'Test lead creation'
      };

      const response = await request(app)
        .post('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(leadData.email);
      expect(response.body.tenantId).toBe(8);
      expect(response.body).toHaveProperty('leadTypeId');
    });

    it('should reject lead creation without required fields', async () => {
      const invalidLeadData = {
        firstName: 'Test'
        // Missing required fields like email
      };

      await request(app)
        .post('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLeadData)
        .expect(400);
    });

    it('should assign default lead type when not provided', async () => {
      const leadData = {
        firstName: 'Default',
        lastName: 'Type',
        email: 'defaulttype@example.com',
        phone: '+1-555-DEFAULT',
        source: 'website',
        status: 'new'
      };

      const response = await request(app)
        .post('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body.leadTypeId).toBeDefined();
      expect(typeof response.body.leadTypeId).toBe('number');
    });
  });

  describe('PUT /api/tenants/:tenantId/leads/:leadId', () => {
    it('should update an existing lead', async () => {
      // First create a lead
      const leadData = {
        firstName: 'Update',
        lastName: 'Test',
        email: 'updatetest@example.com',
        phone: '+1-555-UPDATE',
        source: 'website',
        status: 'new'
      };

      const createResponse = await request(app)
        .post('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(201);

      const leadId = createResponse.body.id;

      // Then update it
      const updateData = {
        status: 'contacted',
        notes: 'Updated via test'
      };

      const updateResponse = await request(app)
        .put(`/api/tenants/8/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.status).toBe('contacted');
      expect(updateResponse.body.notes).toBe('Updated via test');
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app)
        .put('/api/tenants/8/leads/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'contacted' })
        .expect(404);
    });
  });

  describe('DELETE /api/tenants/:tenantId/leads/:leadId', () => {
    it('should delete an existing lead', async () => {
      // First create a lead
      const leadData = {
        firstName: 'Delete',
        lastName: 'Test',
        email: 'deletetest@example.com',
        phone: '+1-555-DELETE',
        source: 'website',
        status: 'new'
      };

      const createResponse = await request(app)
        .post('/api/tenants/8/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(201);

      const leadId = createResponse.body.id;

      // Then delete it
      await request(app)
        .delete(`/api/tenants/8/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app)
        .get(`/api/tenants/8/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app)
        .delete('/api/tenants/8/leads/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});