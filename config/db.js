const mongoose = require('mongoose');

// Cache the connection promise to prevent multiple concurrent connection attempts
let cachedPromise = null;

const connectDB = async () => {
    // If already connected, return immediately
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If a connection attempt is already in progress, wait for it
    if (cachedPromise) {
        return cachedPromise;
    }

    const options = {
        maxPoolSize: 10, // Reduced from 20 for faster cold starts
        minPoolSize: 0,  // Set to 0 for serverless efficiency
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority'
    };

    console.time('🚀 DB Connection Time');
    
    cachedPromise = mongoose.connect(process.env.MONGO_URI, options)
        .then((mongoose) => {
            console.log('✅ MongoDB Connected (Optimized)');
            console.timeEnd('🚀 DB Connection Time');
            return mongoose;
        })
        .catch((err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
            cachedPromise = null; // Reset cache so next attempt can try again
            throw err;
        });

    return cachedPromise;
};

module.exports = connectDB;

