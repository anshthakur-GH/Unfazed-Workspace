const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        console.time('DB Connection Time');
        await mongoose.connect(process.env.MONGO_URI, {
            // Optimized for MongoDB Atlas performance
            maxPoolSize: 100,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 3000, // Faster failure if DB is down
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            w: 'majority'
        });

        isConnected = true;
        console.log('MongoDB Connected (Optimized Pool)');
        console.timeEnd('DB Connection Time');
    } catch (error) {
        isConnected = false;
        console.error('MongoDB connection error:', error.message);
    }
};

module.exports = connectDB;

