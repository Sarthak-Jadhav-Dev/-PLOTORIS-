require('dotenv').config();
const express = require('express');
const app = express();
const registerRoutes = require('./router/register.routes');
const authMiddleware = require('./middleware/auth.middleware');

app.use(express.json());
app.post('/api/auth',registerRoutes);

module.exports = app;