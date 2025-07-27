# Testing Documentation

## Overview

This project includes comprehensive testing for the JavaScript game logic using Jest framework. The testing suite covers core game systems, integration scenarios, and edge cases.

## Test Structure

```
tests/
├── setup.js                 # Test configuration and mocks
├── core/                     # Core game system tests
│   └── Game.test.js         # Main game controller tests
├── puzzle/                   # Match-3 puzzle game tests
│   ├── Tile.test.js         # Individual tile logic tests
│   └── Board.test.js        # Game board management tests
├── economy/                  # Currency and monetization tests
│   └── Currency.test.js     # Currency system tests
├── integration/              # Integration and flow tests
│   └── GameFlow.test.js     # Cross-system integration tests
└── (future test directories)
```

## Running Tests

### Prerequisites

Make sure you have Node.js installed and dependencies installed:

```bash
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-restart on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch mode)
npm run test:ci
```

### Example Output

```
Test Suites: 5 passed, 5 total
Tests:       112 passed, 112 total
Snapshots:   0 total
Time:        1.796 s
```

## Test Categories

### Unit Tests

**Tile Tests** (`tests/puzzle/Tile.test.js`)
- Tile creation and properties
- Position management
- Special tile functionality
- Matching logic
- State management
- Edge cases

**Currency Tests** (`tests/economy/Currency.test.js`)
- Currency retrieval and limits
- Adding and spending currency
- Affordability checks
- Transaction history
- Daily bonuses and multipliers
- Error handling

**Game Tests** (`tests/core/Game.test.js`)
- Game initialization and state management
- Screen transitions
- Currency operations
- UI updates
- Save/load simulation
- Game reset functionality

**Board Tests** (`tests/puzzle/Board.test.js`)
- Board initialization and dimensions
- Tile placement and retrieval
- Position validation
- Tile swapping
- Match detection
- Gravity system
- Board manipulation

### Integration Tests

**Game Flow Tests** (`tests/integration/GameFlow.test.js`)
- Complete game initialization flow
- Level start to completion workflow
- Currency transactions during gameplay
- Screen management with state preservation
- Error handling across systems
- Performance and memory management
- Save/load state preservation

## Test Features

### Mocking Strategy

The tests use comprehensive mocks to isolate functionality:

- **DOM Elements**: Mock HTML elements for UI testing
- **Browser APIs**: localStorage, sessionStorage, requestAnimationFrame
- **Game Classes**: Simplified versions of core classes for testing
- **Console Methods**: Mocked to reduce test noise

### Test Data

Tests use realistic game data:
- Various tile types and positions
- Currency amounts and limits
- Game state combinations
- Error conditions and edge cases

### Assertions

Tests verify:
- ✅ Correct return values and state changes
- ✅ Proper error handling
- ✅ Edge case behavior
- ✅ Integration between systems
- ✅ Performance constraints

## Adding New Tests

### For New Features

1. Create test file in appropriate directory:
   ```bash
   touch tests/[category]/[FeatureName].test.js
   ```

2. Follow the existing test structure:
   ```javascript
   describe('FeatureName', () => {
     let feature;
     
     beforeEach(() => {
       // Setup
     });
     
     describe('Category', () => {
       test('should do something', () => {
         // Test implementation
       });
     });
   });
   ```

3. Include edge cases and error conditions

### Test Guidelines

- **Descriptive Names**: Use clear, descriptive test names
- **Single Responsibility**: Each test should verify one specific behavior
- **Independent Tests**: Tests should not depend on each other
- **Realistic Data**: Use data that reflects actual game usage
- **Error Testing**: Include negative test cases
- **Performance**: Avoid slow operations in tests

## CI/CD Integration

The test configuration supports continuous integration:

- **Deterministic**: Tests produce consistent results
- **Fast**: Complete test suite runs in under 5 seconds
- **Isolated**: No external dependencies
- **Reporting**: Detailed output for debugging

### GitHub Actions Example

```yaml
- name: Run Tests
  run: npm run test:ci

- name: Generate Coverage
  run: npm run test:coverage
```

## Debugging Tests

### Common Issues

1. **DOM Dependencies**: Ensure test setup includes necessary DOM elements
2. **Async Operations**: Use proper async/await patterns
3. **Mock Synchronization**: Verify mocks match actual interfaces
4. **State Cleanup**: Reset state between tests

### Debug Commands

```bash
# Run specific test file
npm test -- tests/puzzle/Tile.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Currency"

# Run with verbose output
npm test -- --verbose
```

## Future Enhancements

### Planned Testing Improvements

- **E2E Tests**: Browser automation testing with Playwright
- **Performance Tests**: Load testing and memory profiling
- **Visual Tests**: Screenshot comparison testing
- **Mobile Tests**: Device-specific testing
- **Accessibility Tests**: Screen reader and keyboard navigation

### Additional Test Coverage

- UI component testing
- Animation and timing tests
- Sound and audio tests
- Analytics and tracking tests
- Offline functionality tests

---

**Total Test Coverage**: 112 tests across 5 test suites covering core game functionality, integration scenarios, and edge cases.