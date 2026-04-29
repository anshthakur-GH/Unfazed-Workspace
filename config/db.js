const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        console.time('DB Connection Time');
        const db = await mongoose.connect(process.env.MONGO_URI, {
            // Optimized for MongoDB Atlas
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            heartbeatFrequencyMS: 10000, // Frequent heartbeats to keep connection alive
        });

        isConnected = true;
        console.log('MongoDB Connected');
        console.timeEnd('DB Connection Time');
    } catch (error) {
        isConnected = false;
        console.error('MongoDB connection error:', error.message);
    }
};

module.exports = connectDB;

