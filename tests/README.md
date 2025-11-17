# Testing Guide for Empatify

This project uses a layered testing approach with modern tools for comprehensive test coverage.

## 🏗️ Test Stack Architecture

```
/tests
├── /unit              # Unit tests (Vitest)
├── /component         # Component tests (Testing Library + Vitest)
├── /e2e               # End-to-end tests (Playwright + Cucumber)
│   ├── /features      # Gherkin .feature files (User Stories)
│   ├── /steps         # Cucumber step definitions
│   ├── /pages         # Page Objects for reuse
│   ├── /fixtures      # Test data and fixtures
│   └── /reports       # Test reports
├── /mocks             # MSW handlers for API mocking
└── /utils             # Test utilities and helpers
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Component tests only
npm run test:component

# E2E tests only
npm run test:e2e

# Cucumber BDD tests
npm run test:cucumber
```

## 🧪 Unit Testing (Vitest)

**Purpose:** Test individual functions, utilities, and business logic.

**Location:** `tests/unit/`

**Example:**
```typescript
import { describe, it, expect } from 'vitest'
import { designTokens } from '@/styles/tokens'

describe('Design Tokens', () => {
  it('should export primary colors', () => {
    expect(designTokens.colors.primary[500]).toBe('#FF6B00')
  })
})
```

**Run:** `npm run test:unit`

## 🎨 Component Testing (Testing Library + Vitest)

**Purpose:** Test React components in isolation with DOM behavior validation.

**Location:** `tests/component/`

**Features:**
- ✅ Accessibility testing with axe-core
- ✅ User interaction testing
- ✅ Component state testing
- ✅ Design token validation

**Example:**
```typescript
import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should be accessible', async () => {
    const { container } = render(<Button>Click me</Button>)
    await expectToBeAccessible(container)
  })
})
```

**Run:** `npm run test:component`

## 🌐 End-to-End Testing (Playwright + Cucumber)

**Purpose:** Test complete user workflows and stories across browsers.

**Location:** `tests/e2e/`

**Features:**
- 🚀 Fast execution with Playwright
- 📱 Multi-browser testing (Chrome, Firefox, Safari)
- 📱 Mobile device testing
- 🎭 BDD with Gherkin + Cucumber
- ♿ Accessibility testing with @axe-core/playwright
- 📊 Rich reporting and tracing

### BDD Workflow

1. **Write User Stories** in `tests/e2e/features/*.feature`
2. **Define Steps** in `tests/e2e/steps/*.steps.ts`
3. **Create Page Objects** in `tests/e2e/pages/*.ts`
4. **Run Tests** with `npm run test:e2e`

**Example Feature:**
```gherkin
Feature: Home Page
  As a user
  I want to visit the home page
  So that I can learn about Empatify

  Scenario: View home page content
    Given I am on the home page
    When I view the page
    Then I should see the main heading "Empatify"
```

**Run:** `npm run test:e2e`

## 🔧 Test Utilities

### Custom Render Function
```typescript
import { render } from '@/tests/utils/test-utils'

// Automatically includes:
// - NextIntlClientProvider
// - Design token context
// - Common test setup
```

### Accessibility Testing
```typescript
import { expectToBeAccessible } from '@/tests/utils/test-utils'

it('should be accessible', async () => {
  const { container } = render(<MyComponent />)
  await expectToBeAccessible(container)
})
```

### Form Testing
```typescript
import { fillFormField, submitForm } from '@/tests/utils/test-utils'

it('should submit form', async () => {
  await fillFormField('Email', 'test@example.com')
  await submitForm('Submit')
})
```

## 🎭 API Mocking (MSW)

**Purpose:** Mock API calls during testing for consistent, fast tests.

**Location:** `tests/mocks/`

**Features:**
- 🔄 Intercepts real HTTP requests
- 📝 Predefined mock responses
- 🎯 Easy to customize per test
- 🚀 Works with both Vitest and Playwright

**Usage:**
```typescript
// MSW automatically intercepts API calls in tests
// No additional setup needed in individual tests
```

## 📊 Test Coverage

### Generate Coverage Report
```bash
npm run test:coverage
```

### Coverage Targets
- **Statements:** 80%
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm run test:ci
```

### Test Commands for CI
```bash
# Fast, CI-optimized test run
npm run test:ci

# Verbose output for debugging
npm run test:run -- --reporter=verbose
```

## 🎯 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Always test accessibility

### 3. E2E Testing
- Write tests from user perspective
- Use Page Objects for maintainability
- Test critical user journeys

### 4. Mocking
- Mock external dependencies
- Use realistic test data
- Keep mocks simple and focused

## 🐛 Debugging

### Debug Unit/Component Tests
```bash
npm run test:ui
```

### Debug E2E Tests
```bash
npm run test:e2e:debug
npm run test:e2e:headed
```

### View Test Reports
```bash
# E2E HTML reports
open tests/e2e/reports/html/index.html

# Coverage reports
open coverage/index.html
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Cucumber.js](https://cucumber.io/docs/cucumber/)
- [MSW Documentation](https://mswjs.io/)
- [Axe Core](https://www.deque.com/axe/)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Use the provided test utilities
3. Ensure accessibility compliance
4. Add appropriate test coverage
5. Update this README if needed












