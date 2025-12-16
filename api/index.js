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

// Health Check
app.get("/health", (req, res) => {
    res.status(200).send("ok");
});

// Routes
const subspaceRoutes = require('../routes/subspaces');
const todoRoutes = require('../routes/todos');
const agencyRoutes = require('../routes/agency');
const recordRoutes = require('../routes/records');

app.use('/api/subspaces', subspaceRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/records', recordRoutes);

// Auth Route (Hardcoded)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Credentials
    const users = [
        { username: 'Ansh_Unfazed', password: '***REMOVED***' },
        { username: 'Navtej_unfazed', password: '***REMOVED***' }
    ];

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, token: `fake-jwt-token-${user.username}` });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = app;
