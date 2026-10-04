const mongoose = require('mongoose');
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/db');

describe('Module 1: Edge Cases & Operational Verification', () => {
  // TC-M1-011 & TC-M1-013: Connect and Graceful Disconnect
  it('TC-M1-011 & TC-M1-013: should connect and disconnect from MongoDB cleanly', async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
    expect(getDBStatus()).toBe('connected');

    await disconnectDB();
    expect(mongoose.connection.readyState).toBe(0);
    expect(getDBStatus()).toBe('disconnected');

    // Reconnect for remaining test teardowns
    await connectDB();
    expect(getDBStatus()).toBe('connected');
  });

  // TC-M1-012: Connection failure handling with invalid URI
  it('TC-M1-012: should handle invalid MongoDB connection URI gracefully without crash', async () => {
    await disconnectDB();
    const invalidUri = 'mongodb://127.0.0.1:59999/invalid_db?serverSelectionTimeoutMS=500';
    await expect(connectDB(invalidUri)).rejects.toThrow();
    
    // Reconnect for remaining test teardowns
    await connectDB();
    expect(getDBStatus()).toBe('connected');
  });

  // TC-M1-010: Missing Environment Configuration Check
  it('TC-M1-010: should validate presence of required environment settings', () => {
    const config = require('../src/config');
    expect(config.port).toBeDefined();
    expect(config.mongodbUri).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(config.corsOrigin).toBeDefined();
  });
});
