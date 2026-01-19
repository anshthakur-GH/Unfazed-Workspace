require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/schemas');
const connectDB = require('../config/db');

const seedUsers = async () => {
    await connectDB();

    const users = [
        { username: 'Ansh_Unfazed', password: '***REMOVED***' },
        { username: 'Navtej_unfazed', password: '***REMOVED***' }
    ];

    try {
        for (const user of users) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);

            // Update if exists, or insert new
            await User.findOneAndUpdate(
                { username: user.username },
                { password: hashedPassword },
                { upsert: true, new: true }
            );
            console.log(`User ${user.username} seeded successfully.`);
        }
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        mongoose.disconnect();
    }
};

seedUsers();
