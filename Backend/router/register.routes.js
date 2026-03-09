const express = require('express');
const router = express.Router();
const {registerUser} = require('../controller/register.controller');
const {loginUser} = require('../controller/login.controller');

router.post('/login',loginUser);
router.post('/register',registerUser);
module.exports = router;