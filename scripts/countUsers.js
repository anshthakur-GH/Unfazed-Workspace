require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/schemas');
const connectDB = require('../config/db');

const countUsers = async () => {
    try {
        await connectDB();
        const count = await User.countDocuments();
        const users = await User.find({}, 'username');
        console.log(`Total users in database: ${count}`);
        console.log('Usernames:', users.map(u => u.username).join(', '));
    } catch (err) {
        console.error('Error counting users:', err);
    } finally {
        mongoose.disconnect();
    }
};

countUsers();
