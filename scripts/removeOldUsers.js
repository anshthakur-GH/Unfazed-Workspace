require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/schemas');
const connectDB = require('../config/db');

const removeOldUsers = async () => {
    try {
        await connectDB();

        // List all users before deletion
        const usersBefore = await User.find({}, 'username');
        console.log('Users before cleanup:', usersBefore.map(u => u.username).join(', '));

        // Remove all users except Ansh_Unfazed and Ayush_Unfazed
        const result = await User.deleteMany({
            username: { $nin: ['Ansh_Unfazed', 'Ayush_Unfazed'] }
        });

        console.log(`\n✅ Removed ${result.deletedCount} user(s).`);

        // List remaining users
        const usersAfter = await User.find({}, 'username');
        console.log('Remaining users:', usersAfter.map(u => u.username).join(', '));

    } catch (err) {
        console.error('Error removing users:', err);
    } finally {
        mongoose.disconnect();
    }
};

removeOldUsers();
