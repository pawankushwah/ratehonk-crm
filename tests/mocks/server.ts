import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock data for testing
const mockDashboardData = {
  metrics: {
    revenue: 6050,
    bookings: 5,
    customers: 15,
    leads: 8
  },
  recentBookings: [
    {
      id: 1,
      customerName: 'John Doe',
      packageName: 'Bali Adventure',
      amount: 2500,
      status: 'confirmed'
    }
  ]
};

const mockLeads = [
  {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    phone: '+1-555-0101',
    source: 'website',
    status: 'new',
    score: 85,
    priority: 'high',
    leadTypeId: 1,
    tenantId: 8
  },
  {
    id: 2,
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael@example.com',
    phone: '+1-555-0102',
    source: 'referral',
    status: 'contacted',
    score: 72,
    priority: 'medium',
    leadTypeId: 1,
    tenantId: 8
  }
];

const mockCustomers = [
  {
    id: 1,
    name: 'Alex Turner',
    email: 'alex@example.com',
    phone: '+1-555-1001',
    status: 'active',
    tenantId: 8
  }
];

export const handlers = [
  // Dashboard endpoints
  http.get('/api/dashboard/tenant/:tenantId', () => {
    return HttpResponse.json(mockDashboardData);
  }),

  // Leads endpoints
  http.get('/api/tenants/:tenantId/leads', () => {
    return HttpResponse.json(mockLeads);
  }),

  http.post('/api/tenants/:tenantId/leads', async ({ request }) => {
    const leadData = await request.json() as any;
    const newLead = {
      id: Date.now(),
      ...leadData,
      tenantId: 8,
      leadTypeId: leadData.leadTypeId || 1,
      score: 50,
      priority: 'medium'
    };
    return HttpResponse.json(newLead, { status: 201 });
  }),

  http.put('/api/tenants/:tenantId/leads/:leadId', async ({ request, params }) => {
    const updates = await request.json() as any;
    const leadId = Number(params.leadId);
    const existingLead = mockLeads.find(l => l.id === leadId);
    
    if (!existingLead) {
      return HttpResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedLead = { ...existingLead, ...updates };
    return HttpResponse.json(updatedLead);
  }),

  http.delete('/api/tenants/:tenantId/leads/:leadId', ({ params }) => {
    const leadId = Number(params.leadId);
    const leadIndex = mockLeads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) {
      return HttpResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Lead deleted successfully' });
  }),

  // Customers endpoints
  http.get('/api/tenants/:tenantId/customers', () => {
    return HttpResponse.json(mockCustomers);
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const credentials = await request.json() as any;
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          tenantId: 8,
          role: 'tenant_admin'
        }
      });
    }
    
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  })
];

export const server = setupServer(...handlers);