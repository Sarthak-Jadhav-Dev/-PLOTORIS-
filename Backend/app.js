require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./router/auth.routes');

// --- Middleware ---
app.use(express.json());

// Allow requests from the Next.js frontend (CORS)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Plotoris Backend' }));

module.exports = app;