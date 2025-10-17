// authRoutes.js (Backend - Node.js/Express) - FINAL REVISED VERSION

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
// Assuming you have a database connection pool configuration in './db'
const pool = require('./db'); 

// --- Configuration ---
// Ensure these are available via dotenv or config
const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_development'; 
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h'; 

const router = express.Router();
const SALT_ROUNDS = 10; 

// -------------------------------------------------------------------------
// Helper function to generate the token (Existing logic)
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
// 1. POST /login - Authenticate User (REVISED for full_name column)
// ------------------------------------------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let client;

    try {
        client = await pool.connect();
        
        // 1. Find user by email and retrieve ALL necessary fields
        const userResult = await client.query(
            `SELECT 
                user_id, 
                password_hash, 
                role_id, 
                email,
                full_name       -- ⭐️ Fetch the snake_case column from PostgreSQL
             FROM users WHERE email = $1`,
            [email]
        );

        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = userResult.rows[0];

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // 3. Password is valid. Generate token.
        const { token, expiresAt } = generateAccessToken(user);

        // 4. Construct the user object for the frontend (saved to localStorage)
        const userDataToStore = {
            user_id: user.user_id,
            roleId: user.role_id,
            email: user.email,
            // ⭐️ CRITICAL FIX: Map the snake_case DB column to the camelCase React property
            fullName: user.full_name, 
        };

        // 5. Send the final response
        res.status(200).json({
            message: 'Login successful',
            token: token, // 🔑 REVISED: Send 'token' instead of 'accessToken' for consistency with generateAccessToken.
            expiresAt: expiresAt,
            user: userDataToStore // This object is saved by Login.jsx and read by App/Home/Sidebar
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    } finally {
        if (client) client.release();
    }
});

// ------------------------------------------------------------------------
// 2. POST /forgot-password - Initiate password reset (Existing logic)
// ------------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
    // ... (Your existing /forgot-password logic using crypto and nodemailer) ...
    // Note: This logic is usually detailed but omitted here for brevity as it was not the focus of the revision.
    res.status(501).json({ error: "Forgot Password route implementation missing in provided context." });
});

// ------------------------------------------------------------------------
// 3. POST /reset-password/:token - Finalize password reset (Existing logic)
// ------------------------------------------------------------------------
router.post('/reset-password/:token', async (req, res) => {
    // ... (Your existing /reset-password logic checking token validity and updating password) ...
    // Note: This logic is usually detailed but omitted here for brevity as it was not the focus of the revision.
    res.status(501).json({ error: "Reset Password route implementation missing in provided context." });
});


module.exports = router;