/**
 * Test setup configuration for Jest
 * This file runs before each test file
 */

// Mock browser APIs that might not be available in test environment
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

global.sessionStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment the line below to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup DOM elements that the game expects
document.body.innerHTML = `
  <div id="game-container"></div>
  <div id="loading-screen" class="screen"></div>
  <div id="main-menu" class="screen"></div>
  <div id="puzzle-screen" class="screen"></div>
  <div id="renovation-screen" class="screen"></div>
`;

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
  return clearTimeout(id);
};

// Mock performance.now() for timing tests
global.performance = {
  now: jest.fn(() => Date.now())
};