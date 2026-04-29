require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

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


// Auth Route (Hardcoded)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/schemas');

// Auth Route
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const loginStart = Date.now();
        
        // Quick connection check
        if (!mongoose.connection.readyState) {
            await connectDB();
        }

        const user = await User.findOne({ username }).select('username password').lean();

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        const duration = Date.now() - loginStart;
        console.log(`Login successful for ${username} in ${duration}ms`);

        res.json({ success: true, token, username: user.username });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = app;
