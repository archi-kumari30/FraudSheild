const { connectDB, disconnectDB } = require('../src/config/db');

beforeAll(async () => {
  // Connect to test database before running test suites
  try {
    await connectDB();
  } catch (err) {
    console.warn('[TEST SETUP WARNING] Could not connect to MongoDB for tests:', err.message);
  }
});

afterAll(async () => {
  // Disconnect from database after running test suites
  try {
    await disconnectDB();
  } catch (err) {
    console.warn('[TEST TEARDOWN WARNING] Could not cleanly disconnect from MongoDB:', err.message);
  }
});
