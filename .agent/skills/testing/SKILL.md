---
name: Comprehensive Testing Protocol
description: Mandatory testing guidelines to ensure quality, stability, and regression prevention for every code change.
---

# Comprehensive Testing Protocol

This skill defines the **mandatory testing strategy** for all code changes in the Modula project. Testing is not optional—it is a critical phase that must be executed before any work is considered complete.

## When to Use

**ALWAYS.** Every code change, feature, refactor, or bug fix must include appropriate testing:
- **New Features**: Unit tests + integration tests + manual verification
- **Refactoring**: Regression tests to ensure behavior unchanged
- **Bug Fixes**: Test that reproduces the bug + verification it's fixed
- **Performance Optimization**: Benchmark tests before/after
- **UI Changes**: Visual regression checks + accessibility tests

---

## The Testing Pyramid

Follow this hierarchy (from most to least):

```
         /\
        /  \  E2E Tests (Few)
       /----\
      / UI   \ Component Tests (Some)
     /--------\
    /  Unit    \ Unit Tests (Many)
   /------------\
```

### 1. Unit Tests (Foundation)
- **What**: Test individual functions, utilities, services in isolation
- **Coverage Target**: 80%+ for critical business logic
- **Location**: `*.test.ts` next to the source file
- **Speed**: Fast (<10ms per test)

### 2. Component Tests (Middle Layer)
- **What**: Test React components with mocked dependencies
- **Coverage Target**: All user-facing components
- **Location**: `*.test.tsx` next to component file
- **Speed**: Medium (10-100ms per test)

### 3. Integration Tests (Top Layer)
- **What**: Test multiple modules working together
- **Coverage Target**: Critical user flows
- **Location**: `src/test/integration/*.test.ts`
- **Speed**: Slower (100ms-1s per test)

---

## Test-Driven Development (TDD) Workflow

For **new features** or **bug fixes**, follow the Red-Green-Refactor cycle:

### Phase 1: RED (Write Failing Test)
```typescript
it('should calculate smart layout margins', () => {
  const result = smartLayoutEngine.compute({ width: 800, data: [...] });
  expect(result.marginLeft).toBe(120); // ❌ Fails (not implemented yet)
});
```

### Phase 2: GREEN (Make It Pass)
```typescript
// Implement minimal code to pass the test
export function compute(config) {
  return { marginLeft: 120 }; // ✅ Passes
}
```

### Phase 3: REFACTOR (Improve Code)
```typescript
// Refactor with confidence (tests protect you)
export function compute(config) {
  const labelWidth = measureMaxLabelWidth(config.data);
  return { marginLeft: labelWidth + GUTTER }; // ✅ Still passes
}
```

---

## Testing Stack & Tools

### Core Framework
- **Vitest**: Fast unit test runner (Jest-compatible API)
- **React Testing Library**: Component testing with user-centric queries
- **jsdom**: Browser environment simulation

### Commands
```bash
npm test              # Run all tests once (CI mode)
npm run test:watch    # Watch mode (development)
npm run test:ui       # Visual UI for debugging tests
```

### Assertion Library
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality
expect(value).toBeCloseTo(3.14, 2);    // Float comparison
expect(fn).toThrow('error message');    // Exception testing
expect(array).toHaveLength(5);          // Array length
expect(obj).toHaveProperty('key');      // Object properties
```

---

## Writing Effective Tests

### 1. Test Structure (AAA Pattern)

```typescript
describe('SmartLayoutEngine', () => {
  describe('compute()', () => {
    it('should reserve space for longest label', () => {
      // ARRANGE: Set up test data
      const data = [
        { label: 'Short', value: 10 },
        { label: 'Very Long Label Name', value: 20 }
      ];
      const config = { width: 800, height: 400, data };

      // ACT: Execute the function
      const result = smartLayoutEngine.compute(config);

      // ASSERT: Verify the outcome
      expect(result.marginLeft).toBeGreaterThan(100);
      expect(result.marginLeft).toBeLessThan(200);
    });
  });
});
```

### 2. Test Naming Convention

Use descriptive names that explain **what** is being tested and **expected outcome**:

**❌ Bad:**
```typescript
it('test layout', () => { ... });
it('works correctly', () => { ... });
```

**✅ Good:**
```typescript
it('should apply PDF calibration factor of 1.10 to text width', () => { ... });
it('should evict LRU cache items when capacity exceeds 1000', () => { ... });
it('should throw error when data array is empty', () => { ... });
```

### 3. Test Independence

Each test must be **completely isolated**:

```typescript
describe('TextMeasurementService', () => {
  beforeEach(() => {
    // Reset state before EVERY test
    textMeasurementService.clearCache();
  });

  it('test A', () => { /* isolated */ });
  it('test B', () => { /* isolated */ });
});
```

**Never:**
- Share mutable state between tests
- Rely on test execution order
- Use global variables without cleanup

### 4. Edge Cases & Boundary Testing

Always test the extremes:

```typescript
describe('edge cases', () => {
  it('handles empty string', () => { ... });
  it('handles null/undefined', () => { ... });
  it('handles very large numbers (>1M)', () => { ... });
  it('handles negative values', () => { ... });
  it('handles special characters (emoji, unicode)', () => { ... });
  it('handles array with single item', () => { ... });
  it('handles array with 1000+ items', () => { ... });
});
```

---

## Component Testing Best Practices

### 1. User-Centric Queries (React Testing Library)

**❌ Avoid implementation details:**
```typescript
// Bad: Testing internal structure
const button = container.querySelector('.btn-primary');
```

**✅ Test like a user:**
```typescript
import { render, screen } from '@testing-library/react';

it('should display chart title', () => {
  render(<BarChart title="Sales Data" data={[...]} />);
  
  // Query by accessible role/text (how users interact)
  expect(screen.getByText('Sales Data')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /bar chart/i })).toBeInTheDocument();
});
```

### 2. Testing User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should toggle legend visibility on click', async () => {
  const user = userEvent.setup();
  render(<Chart data={[...]} />);
  
  const toggleButton = screen.getByRole('button', { name: /toggle legend/i });
  
  // Initial state
  expect(screen.getByTestId('legend')).toBeVisible();
  
  // Click to hide
  await user.click(toggleButton);
  expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
  
  // Click to show
  await user.click(toggleButton);
  expect(screen.getByTestId('legend')).toBeVisible();
});
```

### 3. Mocking Dependencies

```typescript
import { vi } from 'vitest';

// Mock external service
vi.mock('./TextMeasurementService', () => ({
  textMeasurementService: {
    measureTextWidth: vi.fn(() => 100),
    measureBatch: vi.fn(() => [100, 120, 80])
  }
}));

it('should use mocked measurements', () => {
  const result = smartLayoutEngine.compute({ ... });
  
  expect(textMeasurementService.measureTextWidth).toHaveBeenCalledWith({
    text: 'Label',
    fontSize: 14,
    fontFamily: 'Inter'
  });
});
```

---

## Regression Prevention Strategy

### 1. Snapshot Testing (Use Sparingly)

For complex objects that shouldn't change:

```typescript
it('should maintain consistent layout structure', () => {
  const layout = smartLayoutEngine.compute({ ... });
  
  // First run creates snapshot, subsequent runs compare
  expect(layout).toMatchSnapshot();
});
```

**⚠️ Warning**: Only use for stable APIs. Update snapshots carefully.

### 2. Visual Regression (Manual)

For UI changes, always:
1. **Before**: Screenshot the component in browser
2. **After**: Screenshot after changes
3. **Compare**: Use diff tools or visual inspection
4. **Document**: Include in `walkthrough.md`

### 3. Performance Regression

```typescript
it('should measure 1000 texts in <100ms', () => {
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    textMeasurementService.measureTextWidth({ text: `Text ${i}`, fontSize: 14 });
  }
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});
```

---

## Coverage Requirements

### Minimum Coverage Thresholds

| Type | Threshold | Priority |
|------|-----------|----------|
| **Critical Business Logic** | 90%+ | 🔴 Mandatory |
| **Services & Utilities** | 80%+ | 🟡 Required |
| **UI Components** | 60%+ | 🟢 Recommended |
| **Types & Interfaces** | N/A | - |

### Measuring Coverage

```bash
# Run tests with coverage report
npm test -- --coverage

# View detailed HTML report
open coverage/index.html
```

### What to Prioritize

**High Priority (Must Test):**
- Layout calculation algorithms
- Data transformation logic
- Export services (PDF/PNG)
- State management (Zustand stores)
- Form validation
- API integration

**Low Priority (Optional):**
- Simple getters/setters
- Type definitions
- CSS/styling
- Static content

---

## Integration with Other Skills

### With `task_breakdown`
```markdown
- [ ] **Phase 2: Logic**
    - [ ] Implement `SmartLayoutEngine.compute()`
    - [ ] ✅ Write unit tests for compute() [MANDATORY]
    - [ ] Verify all edge cases pass
```

### With `componentization`
When extracting components, **tests must be refactored too**:
1. Move tests alongside new component
2. Update imports
3. Ensure 100% of original tests still pass
4. Add new tests for component-specific behavior

### With `system_architecture`
The architecture defines **what** to build; tests define **how to verify** it works:
- **Measurement-First**: Test that measurements are accurate
- **Export Fidelity**: Test PDF output matches screen
- **Grid-Aware**: Test layout adapts to grid constraints

---

## Verification Checklist (MANDATORY)

Before marking any task as complete, verify:

### ✅ Automated Tests
- [ ] All new code has corresponding tests
- [ ] All tests pass (`npm test`)
- [ ] No skipped tests (`it.skip`) without justification
- [ ] Coverage meets minimum thresholds
- [ ] No console errors/warnings during test run

### ✅ Build Verification
- [ ] `npm run build` succeeds with no errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical ones)

### ✅ Manual Verification
- [ ] Feature works in browser (`npm run dev`)
- [ ] No console errors in browser DevTools
- [ ] Visual appearance matches design
- [ ] Responsive behavior correct (mobile/desktop)
- [ ] PDF export works (if applicable)

### ✅ Regression Check
- [ ] Existing features still work
- [ ] No visual regressions
- [ ] Performance not degraded

---

## Common Testing Patterns

### Pattern 1: Testing Async Code

```typescript
it('should load fonts before measuring', async () => {
  const promise = textMeasurementService.fontsReady();
  
  await expect(promise).resolves.toBe(true);
  
  // Or with async/await
  const result = await textMeasurementService.fontsReady();
  expect(result).toBe(true);
});
```

### Pattern 2: Testing Error Handling

```typescript
it('should throw error when data is invalid', () => {
  expect(() => {
    smartLayoutEngine.compute({ data: null });
  }).toThrow('Data cannot be null');
  
  // Or for async
  await expect(async () => {
    await fetchData(invalidId);
  }).rejects.toThrow('Not found');
});
```

### Pattern 3: Testing Cache Behavior

```typescript
it('should cache measurements for performance', () => {
  service.clearCache();
  
  const options = { text: 'Test', fontSize: 14 };
  
  // First call: cache miss
  service.measure(options);
  expect(service.getCacheStats().misses).toBe(1);
  
  // Second call: cache hit
  service.measure(options);
  expect(service.getCacheStats().hits).toBe(1);
});
```

### Pattern 4: Testing React Hooks

```typescript
import { renderHook } from '@testing-library/react';

it('should calculate layout on data change', () => {
  const { result, rerender } = renderHook(
    ({ data }) => useSmartLayout({ data }),
    { initialProps: { data: [1, 2, 3] } }
  );
  
  expect(result.current.marginLeft).toBe(80);
  
  // Update props
  rerender({ data: [1, 2, 3, 4, 5] });
  
  expect(result.current.marginLeft).toBe(120); // Recalculated
});
```

---

## Debugging Failed Tests

### 1. Use `it.only` to Isolate

```typescript
it.only('should focus on this test', () => {
  // Only this test runs
});
```

### 2. Add Debug Output

```typescript
import { screen, render } from '@testing-library/react';

it('debug test', () => {
  render(<MyComponent />);
  
  // Print entire DOM
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### 3. Use Vitest UI

```bash
npm run test:ui
```

Opens interactive UI with:
- Test execution timeline
- Console logs
- Error stack traces
- Re-run individual tests

---

## Anti-Patterns (AVOID)

### ❌ Testing Implementation Details

```typescript
// Bad: Testing internal state
expect(component.state.isOpen).toBe(true);

// Good: Testing user-visible behavior
expect(screen.getByRole('dialog')).toBeVisible();
```

### ❌ Overly Specific Assertions

```typescript
// Bad: Brittle test
expect(result.marginLeft).toBe(123.456789);

// Good: Reasonable tolerance
expect(result.marginLeft).toBeCloseTo(123, 0);
```

### ❌ Testing Multiple Things

```typescript
// Bad: One test does everything
it('should work', () => {
  expect(a).toBe(1);
  expect(b).toBe(2);
  expect(c).toBe(3);
  expect(d).toBe(4);
});

// Good: Separate concerns
it('should calculate A correctly', () => { ... });
it('should calculate B correctly', () => { ... });
```

### ❌ Ignoring Async Issues

```typescript
// Bad: Missing await
it('should fetch data', () => {
  fetchData(); // Promise not awaited!
  expect(data).toBeDefined(); // ❌ Fails
});

// Good: Proper async handling
it('should fetch data', async () => {
  await fetchData();
  expect(data).toBeDefined(); // ✅ Passes
});
```

---

## Lessons Learned (Project History)

### 1. PDF Export Fidelity
**Problem**: Charts looked different in PDF vs screen.

**Solution**: Created separate test suites for `target: 'screen'` and `target: 'pdf'` to verify calibration factors.

**Key Learning**: Always test export paths separately with appropriate calibration.

### 2. Cache Invalidation Bugs
**Problem**: Stale measurements after font loading.

**Solution**: Added `fontsReady()` tests that verify cache is cleared.

**Key Learning**: Test state transitions (before/after font load, cache clear, etc.).

### 3. Flaky Component Tests
**Problem**: Tests passed locally but failed in CI.

**Solution**: Used `waitFor()` for async DOM updates instead of fixed timeouts.

**Key Learning**: Never use `setTimeout()` in tests—use Testing Library's async utilities.

---

## Quick Reference

### Test File Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset state
  });

  describe('feature A', () => {
    it('should do X when Y', () => {
      // Arrange
      const data = { ... };
      
      // Act
      const result = functionUnderTest(data);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Common Matchers

```typescript
// Equality
expect(a).toBe(b);                    // ===
expect(a).toEqual(b);                 // Deep equality
expect(a).not.toBe(b);                // !==

// Truthiness
expect(a).toBeTruthy();
expect(a).toBeFalsy();
expect(a).toBeNull();
expect(a).toBeUndefined();
expect(a).toBeDefined();

// Numbers
expect(a).toBeGreaterThan(5);
expect(a).toBeLessThan(10);
expect(a).toBeCloseTo(3.14, 2);       // Precision: 2 decimals

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(arr).toHaveLength(5);
expect(arr).toContain(item);
expect(arr).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ a: 1 });

// Functions
expect(fn).toThrow();
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(3);
```

---

## Final Rule: No Untested Code

**Every code change must include tests.** No exceptions.

If you cannot write a test for your code, it means:
1. The code is too complex (refactor it)
2. The code has too many dependencies (decouple it)
3. The code is not testable (redesign it)

**Testing is not a separate phase—it is part of development.**
