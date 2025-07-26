import { Database } from '../src/database/database';

// Setup test database
beforeEach(() => {
  // Use in-memory database for tests
  process.env.DATABASE_PATH = ':memory:';
});

afterEach(() => {
  // Cleanup after each test
});

// Global test timeout
jest.setTimeout(10000);