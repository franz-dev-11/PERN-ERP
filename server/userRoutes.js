// userRoutes.js (Backend - Node.js/Express) - FINAL VERSION

const express = require('express');
const pool = require('./db'); 
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); // Used for token generation
const nodemailer = require('nodemailer'); 
const router = express.Router();

// Constant for password hashing, matched to authRoutes.js
const SALT_ROUNDS = 10; 

// --- Nodemailer Transport Setup ---
// Uses host/port from .env to support services like ProtonMail Bridge
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // Set 'secure' based on port. true for 465 (SSL/TLS), false for others (like 587/1025)
    secure: process.env.EMAIL_PORT === '465', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This MUST be an App Password/SMTP password
    }
});
// ----------------------------------------

// ------------------------------------------------------------------------
// 1. GET /users - Fetch all users (for the admin table)
// ------------------------------------------------------------------------

router.get('/users', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        
        const result = await client.query(
            // Select status column, and alias user_id to 'id' for the frontend
            `SELECT user_id AS id, username, full_name, email, role_id, status 
             FROM users 
             ORDER BY full_name`
        );
        
        // Map data to the expected frontend structure (camelCase)
        const usersData = result.rows.map(user => ({
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            roleId: user.role_id,
            status: user.status 
        }));

        res.status(200).json(usersData);
    } catch (err) {
        console.error('Database Error during GET /users:', err.message);
        res.status(500).json({ error: 'Failed to retrieve user list.' });
    } finally {
        if (client) client.release();
    }
});


// ------------------------------------------------------------------------
// 2. PATCH /users/:id - Update user details
// ------------------------------------------------------------------------

router.patch('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { full_name, username, email, role_id, status, password } = req.body;
    let client;

    try {
        client = await pool.connect();
        
        const queryParts = [];
        const queryValues = [];
        let valueIndex = 1;

        // Build the query dynamically based on fields present in the request body
        if (full_name !== undefined) {
            queryParts.push(`full_name = $${valueIndex++}`);
            queryValues.push(full_name);
        }
        if (username !== undefined) {
            queryParts.push(`username = $${valueIndex++}`);
            queryValues.push(username);
        }
        if (email !== undefined) {
            queryParts.push(`email = $${valueIndex++}`);
            queryValues.push(email);
        }
        if (role_id !== undefined) {
            queryParts.push(`role_id = $${valueIndex++}`);
            queryValues.push(role_id);
        }
        if (status !== undefined) {
            queryParts.push(`status = $${valueIndex++}`);
            queryValues.push(status);
        }
        // If an administrative password change is requested (unlikely in this UI, but safe to include)
        if (password !== undefined) {
            const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
            queryParts.push(`password_hash = $${valueIndex++}`);
            queryValues.push(password_hash);
        }

        if (queryParts.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        // Add the user ID to the values array for the WHERE clause
        queryValues.push(id);
        
        // Construct the final UPDATE query
        const updateQuery = `
            UPDATE users 
            SET ${queryParts.join(', ')}
            WHERE user_id = $${valueIndex} 
            RETURNING user_id;
        `;

        // Execute the query
        const result = await client.query(updateQuery, queryValues);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        res.status(200).json({ message: 'User updated successfully.' });

    } catch (err) {
        console.error('Server Error during user update:', err.message); 
        
        // Send the actual database error message to the frontend for diagnosis.
        const errorMessage = err.detail || err.message;
        
        res.status(500).json({ 
            error: `Failed to update user data. Error detail: ${errorMessage}` 
        });
    } finally {
        if (client) client.release();
    }
});


// ------------------------------------------------------------------------
// 3. POST /users/:id/send-reset-link - Administrative Password Reset Initiation
// ------------------------------------------------------------------------

router.post('/users/:id/send-reset-link', async (req, res) => {
    const { id } = req.params;
    let client;
    
    try {
        client = await pool.connect();
        
        // 1. Find the user and get their email
        const userResult = await client.query(
            'SELECT email FROM users WHERE user_id = $1', 
            [id]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const userEmail = userResult.rows[0].email;
        if (!userEmail) {
            return res.status(400).json({ error: 'User has no email address configured.' });
        }

        // 2. Generate token and set expiration (24 hours)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = Date.now() + (3600000 * 24); // 24 hours in milliseconds
        
        // 3. Store the token and expiration in the database
        // NOTE: Postgres stores the date/time correctly from milliseconds
        await client.query(
            `UPDATE users 
             SET reset_password_token = $1, reset_password_expires = to_timestamp($2 / 1000.0) 
             WHERE user_id = $3`,
            [resetToken, tokenExpiration, id]
        );
        
        // 4. Construct the reset link and email content
        // The URL must match the new route defined in your App.jsx
        const resetURL = `http://localhost:5173/reset-password/${resetToken}`; 
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Password Reset Request',
            html: `
                <p>You are receiving this because a password reset was initiated for your account by an administrator.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>The link will expire in 24 hours.</p>
            `,
        };

        // 5. Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            message: `Password reset link sent to ${userEmail}` 
        });

    } catch (err) {
        console.error('Password Reset Initiation Error:', err.message);
        
        let errorMessage = 'Failed to initiate password reset due to a server error.';

        if (err.message.includes('column "reset_password_token"')) {
            errorMessage = 'Database schema error: Missing "reset_password_token" or "reset_password_expires" columns.';
        } else if (err.message.includes('Nodemailer') || err.message.includes('credentials')) {
             errorMessage = 'Email service failed. Check EMAIL_USER, EMAIL_PASS, and host/port configuration.';
        }
        
        res.status(500).json({ error: errorMessage });
    } finally {
        if (client) client.release();
    }
});


module.exports = router;