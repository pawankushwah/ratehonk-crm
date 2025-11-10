import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });

interface CustomRenderOptions extends RenderOptions {
  queryClient?: QueryClient;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data factories
export const createMockLead = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  firstName: 'Test',
  lastName: 'Lead',
  email: 'test@example.com',
  phone: '+1-555-0100',
  source: 'website',
  status: 'new',
  score: 75,
  priority: 'medium',
  leadTypeId: 1,
  tenantId: 8,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCustomer = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1-555-0200',
  status: 'active',
  tenantId: 8,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  bookingNumber: `BK${Date.now()}`,
  customerId: 1,
  packageId: 1,
  travelDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  travelers: 2,
  totalAmount: 2500.00,
  amountPaid: 1000.00,
  paymentStatus: 'partial',
  status: 'confirmed',
  tenantId: 8,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockDashboardData = (overrides = {}) => ({
  metrics: {
    revenue: 25000,
    bookings: 12,
    customers: 45,
    leads: 23,
  },
  recentBookings: [
    createMockBooking({ customerName: 'Alice Johnson' }),
    createMockBooking({ customerName: 'Bob Smith' }),
  ],
  ...overrides,
});

// Authentication helpers
export const mockAuthToken = 'mock-jwt-token';

export const mockAuthUser = {
  id: 1,
  email: 'test@example.com',
  tenantId: 8,
  role: 'tenant_admin',
  firstName: 'Test',
  lastName: 'User',
};

// Local storage mock
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Navigation mock for wouter
export const mockNavigate = vi.fn();
export const mockLocation = ['/dashboard', mockNavigate];

// Common test utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

export const expectElementToBeInDocument = async (getByTestId: any, testId: string) => {
  await waitForLoadingToFinish();
  const element = getByTestId(testId);
  expect(element).toBeInTheDocument();
  return element;
};

// Error boundary for testing
export const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-container">
      {children}
    </div>
  );
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };