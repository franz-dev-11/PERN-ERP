// authRoutes.js (Backend - CommonJS Syntax)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const pool = require('./db'); 

// --- Configuration (In a production app, these would come from environment variables) ---
const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_development'; 
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h'; // Token expires after 1 hour

const router = express.Router();
const SALT_ROUNDS = 10; 

// -------------------------------------------------------------------------
// Helper function to generate the token
// -------------------------------------------------------------------------
function generateAccessToken(user) {
    const payload = {
        sub: user.user_id, // Subject: User ID
        role: user.role_id, 
        email: user.email 
    };

    // Sign the token and set the expiration time
    const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: ACCESS_TOKEN_EXPIRY 
    });
    
    // Decode to get the 'exp' (expiration) claim
    const decoded = jwt.decode(token);
    
    // Convert 'exp' (seconds) to milliseconds for the JavaScript Date object
    const expiresAtMs = decoded.exp * 1000; 

    return {
        token: token,
        expiresAt: expiresAtMs
    };
}
// -------------------------------------------------------------------------

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
  const { username, email, password, firstName, lastName, roleId } = req.body;

  if (!username || !email || !password || !firstName || !lastName || !roleId || password.length < 6) {
    return res.status(400).json({ 
        error: 'Please provide all required details (username, email, password, full name, and a role ID).' 
    });
  }

  const full_name = `${firstName} ${lastName}`;
  let client;
  let is_admin_assigned = false;
  let final_role_id = roleId; 
  
  try {
    client = await pool.connect();
    await client.query('BEGIN'); 

    // 1. CONDITIONAL ADMIN CHECK
    const userCountQuery = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountQuery.rows[0].count, 10);
    
    if (userCount === 0) {
      const adminRoleQuery = await client.query(`
        SELECT role_id FROM Roles WHERE role_name = 'System Administrator'
      `);
      if (adminRoleQuery.rows.length > 0) {
        final_role_id = adminRoleQuery.rows[0].role_id;
        is_admin_assigned = true;
      }
    }

    // 2. Check for existing user
    const checkUserQuery = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (checkUserQuery.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'User with that email already exists.' });
    }

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Insert new user
    const insertQuery = `
      INSERT INTO Users (username, email, password_hash, full_name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id;
    `;
    const result = await client.query(insertQuery, [username, email, password_hash, full_name, final_role_id]);
    
    await client.query('COMMIT'); 

    res.status(201).json({ 
        message: is_admin_assigned ? 
            'Initial System Administrator account created successfully.' : 
            'User registered successfully.', 
        user_id: result.rows[0].user_id 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Server Error during signup:', err.message);
    res.status(500).json({ error: 'Server error during registration. Check server console.' });
  } finally {
    if (client) client.release();
  }
});


// 🔑 POST /api/auth/login - Log in a user (REVISED)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // 1. Find user by email (Fetch all necessary fields)
        const userQuery = await pool.query(
            `SELECT user_id, username, email, password_hash, role_id, full_name FROM Users WHERE email = $1`, 
            [email]
        );

        const user = userQuery.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' }); 
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' }); 
        }

        // 3. GENERATE THE TIME-LIMITED TOKEN
        const { token, expiresAt } = generateAccessToken(user);
        
        // 4. Login successful: Send user data, the Access Token, and its expiration time
        res.status(200).json({ 
            message: 'Login successful.',
            // Flatten user object for simplicity, but it's okay to send it nested too.
            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name, 
                role_id: user.role_id,
                email: user.email 
            },
            accessToken: token, // 👈 The actual JWT
            tokenExpiresAt: expiresAt // 👈 Expiration time in milliseconds
        });

    } catch (err) {
        console.error('Server Error during login:', err.message);
        res.status(500).json({ error: 'Server error during login. Check server console.' });
    }
});


module.exports = router;