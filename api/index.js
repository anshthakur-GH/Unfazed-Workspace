require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Request Timing Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
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
const dailyWorkRoutes = require('../routes/dailyWorks');
const leadRoutes = require('../routes/leads');


app.use('/api/subspaces', subspaceRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/daily-works', dailyWorkRoutes);
app.use('/api/invoices', require('../routes/invoices'));
app.use('/api/leads', leadRoutes);


// Auth Route (Hardcoded)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/schemas');

// Auth Route
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.time('Login Process');
        console.time('DB Find User');
        const user = await User.findOne({ username });
        console.timeEnd('DB Find User');

        if (!user) {
            console.timeEnd('Login Process');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.time('Bcrypt Compare');
        const isMatch = await bcrypt.compare(password, user.password);
        console.timeEnd('Bcrypt Compare');

        if (!isMatch) {
            console.timeEnd('Login Process');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        console.timeEnd('Login Process');
        res.json({ success: true, token, username: user.username });
    } catch (err) {
        console.timeEnd('Login Process');
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = app;
