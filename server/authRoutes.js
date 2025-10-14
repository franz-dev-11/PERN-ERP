// authRoutes.js (Backend - Node.js/Express) - FINAL VERSION

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const pool = require('./db'); 

// --- Configuration ---
// Ensure these are available via dotenv or config
const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_development'; 
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h'; 

const router = express.Router();
const SALT_ROUNDS = 10; 

// -------------------------------------------------------------------------
// Helper function to generate the token (Your existing logic)
// -------------------------------------------------------------------------
function generateAccessToken(user) {
    const payload = {
        sub: user.user_id, // Subject: User ID
        role: user.role_id, 
        email: user.email 
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: ACCESS_TOKEN_EXPIRY 
    });
    
    const decoded = jwt.decode(token);
    const expiresAtMs = decoded.exp * 1000; 

    return {
        token: token,
        expiresAt: expiresAtMs
    };
}

// ------------------------------------------------------------------------
// 1. POST /login - Authenticate User (Your existing logic)
// ------------------------------------------------------------------------

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    let client;

    try {
        client = await pool.connect();
        
        // Use username to find the user
        const result = await client.query(
            `SELECT user_id, username, password_hash, role_id, email, status, full_name 
             FROM users 
             WHERE username = $1`,
            [username]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid credentials or user not found.' });
        }

        const user = result.rows[0];

        // Check if the user is inactive
        if (user.status === 'Inactive') {
            return res.status(403).json({ error: 'Account is currently inactive. Please contact an administrator.' });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT token
        const tokenData = generateAccessToken(user);

        // Success response
        res.status(200).json({
            token: tokenData.token,
            expiresAt: tokenData.expiresAt,
            user: {
                id: user.user_id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                roleId: user.role_id,
                status: user.status
            }
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    } finally {
        if (client) client.release();
    }
});


// ------------------------------------------------------------------------
// 2. POST /reset-password - Complete the Password Reset (NEW ENDPOINT)
// ------------------------------------------------------------------------

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    let client;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Missing token or new password.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        client = await pool.connect();
        const now = new Date();

        // 1. Find user by token AND check if the token has expired
        const userResult = await client.query(
            `SELECT user_id FROM users 
             WHERE reset_password_token = $1 
             AND reset_password_expires > $2`,
            [token, now]
        );

        if (userResult.rowCount === 0) {
            return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
        }

        const userId = userResult.rows[0].user_id;

        // 2. Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 3. Update password and clear the token fields
        await client.query(
            `UPDATE users 
             SET password_hash = $1, 
                 reset_password_token = NULL, 
                 reset_password_expires = NULL 
             WHERE user_id = $2`,
            [passwordHash, userId]
        );

        res.status(200).json({ message: 'Password has been successfully updated.' });

    } catch (err) {
        console.error('Final password reset error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred during reset.' });
    } finally {
        if (client) client.release();
    }
});


module.exports = router;