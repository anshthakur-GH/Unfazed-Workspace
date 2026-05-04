require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/schemas');

const app = express();

// Connect to Database
connectDB();

// Middleware
const allowedOrigins = [
    'https://workspace.unfazedai.in',
    'http://localhost:5173',
    'http://localhost:3000'
];
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache CORS preflight results for 24 hours
}));
app.use(express.json({ limit: '1mb' })); // Limit JSON size for faster parsing

// Request Timing Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.log(`[SLOW] ${req.method} ${req.originalUrl} - ${duration}ms`);
        } else {
            console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });
    next();
});

// Health Check
app.get("/health", (req, res) => {
    res.status(200).send("ok");
});

// Routes
const subspaceRoutes = require('../routes/subspaces');
const todoRoutes = require('../routes/todos');
const agencyRoutes = require('../routes/agency');
const recordRoutes = require('../routes/records');
const leadRoutes = require('../routes/leads');


app.use('/api/subspaces', subspaceRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/invoices', require('../routes/invoices'));
app.use('/api/leads', leadRoutes);
app.use('/api/goals', require('../routes/goals'));


// Auth Route
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const loginStart = Date.now();

    try {
        // Ensure DB is connected (uses cached promise)
        await connectDB();

        const user = await User.findOne({ username })
            .select('username password')
            .lean();

        if (!user) {
            console.log(`Login failed for ${username}: User not found (${Date.now() - loginStart}ms)`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`Login failed for ${username}: Password mismatch (${Date.now() - loginStart}ms)`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        console.log(`✅ Login successful for ${username} in ${Date.now() - loginStart}ms`);

        res.json({ success: true, token, username: user.username });
    } catch (err) {
        const duration = Date.now() - loginStart;
        console.error(`❌ Login error for ${username} after ${duration}ms:`, err.message);
        
        if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
            return res.status(503).json({ success: false, message: 'Database connection failed' });
        }
        
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = app;
