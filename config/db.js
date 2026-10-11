const mongoose = require('mongoose');

// Cache the connection promise to prevent multiple concurrent connection attempts
let cachedPromise = null;

// Fail-fast cooldown: once a connection attempt fails, avoid re-attempting
// (and re-paying the full serverSelectionTimeoutMS wait) for this long.
const FAILURE_COOLDOWN_MS = 10000;
let lastFailureAt = 0;

const connectDB = async () => {
    // If already connected, return immediately
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If a connection attempt is already in progress, wait for it
    if (cachedPromise) {
        return cachedPromise;
    }

    // If we failed recently, fail fast instead of blocking this request
    // for another serverSelectionTimeoutMS while the DB is still down.
    if (lastFailureAt && Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS) {
        throw new Error('MongoDB recently failed to connect; skipping retry during cooldown');
    }

    const options = {
        maxPoolSize: 10,
        minPoolSize: 2,  // Keep a few warm connections so idle requests don't pay handshake cost
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
    };

    console.time('🚀 DB Connection Time');

    cachedPromise = mongoose.connect(process.env.MONGO_URI, options)
        .then((mongoose) => {
            console.log('✅ MongoDB Connected (Optimized)');
            console.timeEnd('🚀 DB Connection Time');
            lastFailureAt = 0;
            return mongoose;
        })
        .catch((err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
            cachedPromise = null; // Reset cache so next attempt can try again
            lastFailureAt = Date.now();
            throw err;
        });

    return cachedPromise;
};

module.exports = connectDB;

