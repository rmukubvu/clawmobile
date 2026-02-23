# ClawMobile Mobile App Testing

This directory contains the test suite for the ClawMobile mobile app, including unit tests, property-based tests, and integration tests.

## Directory Structure

```
__tests__/
├── setup.ts                 # Jest setup and mocks
├── fixtures/                # Test data and generators
│   ├── messages.ts         # Message fixtures
│   ├── agents.ts           # Agent profile fixtures
│   └── arbitraries.ts      # fast-check generators for property-based testing
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── services/           # Service tests
│   ├── stores/             # Store tests
│   └── utils/              # Utility tests
├── property/                # Property-based tests
│   ├── message-status.test.ts
│   ├── queue-ordering.test.ts
│   └── ...
└── integration/             # Integration tests
    └── ...
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only property-based tests
npm run test:property

# Run only unit tests
npm run test:unit
```

## Testing Approach

### Dual Testing Strategy

We use both **unit tests** and **property-based tests** as complementary approaches:

**Unit Tests:**
- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary cases
- Test UI component rendering and interactions
- Mock external dependencies (WebSocket, AsyncStorage, etc.)

**Property-Based Tests:**
- Verify universal properties across all inputs
- Generate random test data for comprehensive coverage
- Validate state machines and invariants
- Test with minimum 100 iterations per property
- Catch edge cases that manual tests might miss

### Property-Based Testing with fast-check

We use [fast-check](https://github.com/dubzzz/fast-check) for property-based testing. Each property test:

1. Defines a property that should hold true for all valid inputs
2. Uses arbitraries (generators) to create random test data
3. Runs the property test 100+ times with different inputs
4. Shrinks failing cases to find minimal counterexamples

Example:

```typescript
import * as fc from 'fast-check';
import { messageArbitrary } from '../fixtures/arbitraries';

// Feature: mobile-app-mvp-features, Property 1: Message Status State Machine
it('should follow valid status transitions', () => {
  fc.assert(
    fc.property(
      messageArbitrary(),
      (message) => {
        // Test implementation
        return isValidTransition(message.status, newStatus);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Fixtures

Test fixtures provide consistent test data:

- **messages.ts**: Pre-defined message objects for common scenarios
- **agents.ts**: Pre-defined agent profiles
- **arbitraries.ts**: fast-check generators for random data

### Mocks

The `setup.ts` file configures mocks for:

- **AsyncStorage**: Local storage operations
- **WebSocket**: Network communication
- **Expo modules**: Location, Calendar, Camera, Audio, Notifications
- **React Native modules**: Animated, EventEmitter

## Writing Tests

### Unit Test Example

```typescript
import { mockUserMessage } from '../fixtures/messages';
import { MessageStatus } from '../../types/message';

describe('MessageBubble', () => {
  it('should display message content', () => {
    const { getByText } = render(
      <MessageBubble message={mockUserMessage} />
    );
    expect(getByText(mockUserMessage.content)).toBeTruthy();
  });
});
```

### Property Test Example

```typescript
import * as fc from 'fast-check';
import { messageArbitrary } from '../fixtures/arbitraries';

// Feature: mobile-app-mvp-features, Property 3: Offline Queue Persistence
it('should persist and restore queue correctly', () => {
  fc.assert(
    fc.property(
      fc.array(messageArbitrary()),
      async (messages) => {
        await saveQueue(messages);
        const restored = await loadQueue();
        return deepEqual(messages, restored);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Property Test Tagging

Each property test must include a comment referencing the design property:

```typescript
// Feature: mobile-app-mvp-features, Property 1: Message Status State Machine
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7
```

This ensures traceability between requirements, design properties, and tests.

## Coverage Goals

- **Unit tests**: 80%+ code coverage
- **Property tests**: All 33 design properties implemented
- **Integration tests**: Critical user flows covered

## Debugging Failed Tests

When a property test fails:

1. Check the counterexample provided by fast-check
2. The library automatically shrinks to find the minimal failing case
3. Use the seed to reproduce the exact failure
4. Add a unit test for the specific failing case

Example:

```
Property failed after 42 runs with seed 1234567890
Counterexample: { status: 'read', newStatus: 'pending' }
```

## Best Practices

1. **Keep tests focused**: One assertion per test when possible
2. **Use descriptive names**: Test names should explain what is being tested
3. **Avoid test interdependence**: Each test should be independent
4. **Mock external dependencies**: Don't make real network calls or file operations
5. **Test behavior, not implementation**: Focus on what the code does, not how
6. **Use property tests for invariants**: State machines, ordering, persistence
7. **Use unit tests for specifics**: Error messages, UI rendering, edge cases
