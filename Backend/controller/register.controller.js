const supabase = require('../database/dbClient');
const bcrypt = require('bcryptjs');

module.exports = {
    registerUser: async (req, res) => {
        const { user_name, email, password } = req.body;

        if (!user_name || !email || !password) {
            return res.status(400).json({ message: 'user_name, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        try {
            // Check if email already exists
            const { data: existingUser } = await supabase
                .from('Users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                return res.status(409).json({ message: 'An account with this email already exists' });
            }

            // Hash the password before storing
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert new user into Supabase
            const { data, error } = await supabase
                .from('Users')
                .insert([{ user_name, email, password: passwordHash }])
                .select('id, user_name, email')
                .single();

            if (error) {
                console.error('Registration DB error:', error);
                return res.status(500).json({ message: 'Error registering user', error: error.message });
            }

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: data.id,
                    email: data.email,
                    name: data.user_name,
                }
            });
        } catch (err) {
            console.error('Registration error:', err);
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
};