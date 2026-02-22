const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, age, gender } = req.body;

        if (!username || !password || !age || !gender) {
            return res.status(400).json({ error: 'All fields are required: username, password, age, gender' });
        }

        if (typeof age !== 'number' || age < 1 || age > 150) {
            return res.status(400).json({ error: 'Age must be a number between 1 and 150' });
        }

        if (!['Male', 'Female', 'Other'].includes(gender)) {
            return res.status(400).json({ error: 'Gender must be Male, Female, or Other' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, password, age, gender) VALUES (?, ?, ?, ?)'
        ).run(username, hashedPassword, age, gender);

        const user = { id: result.lastInsertRowid, username };
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, username, age, gender }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = generateToken({ id: user.id, username: user.username });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, age: user.age, gender: user.gender }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
