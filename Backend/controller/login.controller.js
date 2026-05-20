const supabase = require('../database/dbClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
    loginUser: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        try {
            // Fetch user by email
            const { data: user, error } = await supabase
                .from('Users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare password with bcrypt hash
            let isMatch = false;
            if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                // Fallback for legacy plaintext passwords (remove in production)
                isMatch = password === user.password;
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.user_name },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.user_name,
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
};