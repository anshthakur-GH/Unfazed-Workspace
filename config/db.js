const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        console.time('DB Connection Time');
        const db = await mongoose.connect(process.env.MONGO_URI, {
            // Optimized for MongoDB Atlas
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4 to avoid potential IPv6 resolution delays
        });

        isConnected = db.connections[0].readyState === 1;
        console.log('MongoDB Connected');
        console.timeEnd('DB Connection Time');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

module.exports = connectDB;

