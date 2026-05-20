const express = require('express');
const router = express.Router();
const { registerUser } = require('../controller/register.controller');
const { loginUser } = require('../controller/login.controller');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

module.exports = router;
