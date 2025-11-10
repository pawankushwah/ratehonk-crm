# TravelCRM Testing Suite

This directory contains comprehensive testing infrastructure for the TravelCRM application.

## Quick Start

```bash
# Run all unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e-ui

# Run API tests only
npm run test:api

# Run component tests only
npm run test:components

# Run load tests
npm run test:load

# Setup Playwright browsers
npm run test:setup
```

## Test Structure

```
tests/
├── api/                 # API integration tests
├── components/          # React component tests
├── e2e/                # End-to-end tests (Playwright)
├── helpers/            # Test utilities and helpers
├── integration/        # Database integration tests
├── load/               # Load and performance tests
├── mocks/              # Mock data and services
├── setup.ts            # Global test setup
└── README.md           # This file
```

## Testing Strategy

### 1. Unit Tests (Vitest + React Testing Library)
- **Location**: `tests/components/`, `tests/api/`
- **Purpose**: Test individual components and functions in isolation
- **Technologies**: Vitest, React Testing Library, MSW for API mocking

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test interactions between components, API endpoints, and database
- **Technologies**: Vitest, Supertest, real database connections

### 3. End-to-End Tests (Playwright)
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows in real browser environment
- **Technologies**: Playwright with Chromium, Firefox, and WebKit

### 4. Load Tests
- **Location**: `tests/load/`
- **Purpose**: Test application performance under load
- **Technologies**: Autocannon for HTTP load testing

## Test Data Management

### Mock Data
- All mock data is centralized in `tests/mocks/`
- Use `tests/helpers/test-utils.tsx` for data factories
- MSW handlers provide consistent API responses

### Test Database
- Integration tests use isolated tenant IDs (999+) to avoid conflicts
- Database operations are tested against real PostgreSQL instance
- Each test cleans up after itself

### Authentication
- Mock JWT tokens for unit tests
- Real authentication flow for E2E tests
- Test user: `test@example.com` / `password`

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '../helpers/test-utils';
import MyComponent from '../../client/src/components/MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### API Tests
```typescript
import request from 'supertest';
import app from '../../server/index';

test('API endpoint returns data', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .set('Authorization', 'Bearer token')
    .expect(200);
    
  expect(response.body).toHaveProperty('data');
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.click('[data-testid="submit"]');
  await expect(page.locator('[data-testid="success"]')).toBeVisible();
});
```

## Test Configuration

### Vitest Configuration
- `vitest.config.ts` - Main testing configuration
- `tests/setup.ts` - Global setup and mocks
- Coverage reports generated in `coverage/` directory

### Playwright Configuration
- `playwright.config.ts` - E2E testing configuration
- Tests run against local development server
- Multiple browser engines tested
- Screenshots captured on failure

### Environment Configuration
- `.env.test` - Test-specific environment variables
- Isolated test database configuration
- Disabled external services during testing

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:run
      - run: npm run test:e2e
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run && npm run check"
    }
  }
}
```

## Performance Testing

### Load Test Thresholds
- Average latency < 1000ms
- P99 latency < 3000ms
- Error rate < 1%
- Minimum throughput > 10 req/s

### Monitoring
- Memory usage tracking
- Database query performance
- API response times
- Error rates and patterns

## Best Practices

### Test Naming
- Descriptive test names that explain the behavior being tested
- Group related tests using `describe` blocks
- Use consistent naming conventions

### Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use fresh instances for each test run

### Mock Management
- Keep mocks close to production data structures
- Update mocks when API contracts change
- Use TypeScript for mock data consistency

### Error Testing
- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

## Debugging Tests

### Failed Tests
1. Check test output for specific error messages
2. Use `npm run test:ui` for interactive debugging
3. Add `console.log` statements for data inspection
4. Verify mock data matches expectations

### E2E Test Failures
1. Check screenshots in `test-results/`
2. Use `npm run test:e2e-ui` for visual debugging
3. Verify selectors match actual DOM elements
4. Check timing issues with proper waits

### Performance Issues
1. Run `npm run test:load` to identify bottlenecks
2. Check database query performance
3. Monitor memory usage during tests
4. Profile API endpoints under load

## Contributing

When adding new features:
1. Write tests before implementation (TDD)
2. Ensure all test types are covered
3. Update mock data if API changes
4. Run full test suite before committing
5. Update this documentation for new patterns

## Troubleshooting

### Common Issues
- **Tests timeout**: Increase timeout in test configuration
- **Database connection**: Check `.env.test` configuration
- **Mock conflicts**: Clear MSW handlers between tests
- **Browser issues**: Run `npm run test:setup` to reinstall browsers

### Getting Help
- Check test output for specific error messages
- Review similar tests for patterns
- Consult Vitest and Playwright documentation
- Ask team members for guidance on complex scenarios