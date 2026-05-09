require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/schemas');
const connectDB = require('../config/db');

const seedUsers = async () => {
    await connectDB();

    const users = [
        { username: process.env.SEED_USER_1_USERNAME, password: process.env.SEED_USER_1_PASSWORD },
        { username: process.env.SEED_USER_2_USERNAME, password: process.env.SEED_USER_2_PASSWORD },
        { username: process.env.SEED_USER_3_USERNAME, password: process.env.SEED_USER_3_PASSWORD },
        { username: process.env.SEED_USER_4_USERNAME, password: process.env.SEED_USER_4_PASSWORD }
    ];

    // Filter out any users with missing credentials
    const validUsers = users.filter(u => u.username && u.password);

    if (validUsers.length === 0) {
        console.error("No valid seed users found in environment variables.");
        mongoose.disconnect();
        return;
    }

    try {
        for (const user of validUsers) {
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
