// userRoutes.js (Backend - Node.js/Express) - FINAL REVISION

const express = require('express');
const pool = require('./db'); 
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); 
const nodemailer = require('nodemailer'); 
const router = express.Router();

const SALT_ROUNDS = 10; 

// 🔑 REVISED NODEMAILER TRANSPORT SETUP
// Use explicit host and port from .env for robustness.
const transporter = nodemailer.createTransport({
    // Using smtp.gmail.com 
    host: process.env.EMAIL_HOST, 
    // Using port 587 
    port: process.env.EMAIL_PORT,
    // When using port 587, the secure flag should be false (it uses STARTTLS)
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    }
});
// ----------------------------------------

// ------------------------------------------------------------------------
// 1. GET /users - Fetch all users
// ... (rest of the GET /users route remains the same)

router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            // ...
            `SELECT user_id AS id, username, full_name, email, role_id, status 
             FROM users 
             ORDER BY full_name`
        );
        // ... (rest of the query logic) ...
        res.status(200).json(usersData);
    } catch (err) {
        console.error('Database Error during GET /users:', err.message);
        res.status(500).json({ error: 'Failed to fetch users from database.' });
    }
});


// ------------------------------------------------------------------------
// 2. PATCH /users/:id - Update a specific user's data 
// ... (rest of the PATCH /users/:id route remains the same)

router.patch('/users/:id', async (req, res) => {
    // ... (rest of the update logic) ...
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
        // ... (user check logic) ...

        const userEmail = userResult.rows[0].email;
        if (!userEmail) {
            return res.status(400).json({ error: 'User has no email address configured.' });
        }

        // 2. Generate token and set expiration
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = Date.now() + (3600000 * 24); // 24 hours
        
        // 3. Store the token and expiration in the database
        await client.query(
            `UPDATE users 
             SET reset_password_token = $1, reset_password_expires = to_timestamp($2 / 1000.0) 
             WHERE user_id = $3`,
            [resetToken, tokenExpiration, id]
        );
        
        // 4. Construct the reset link and email content
        const resetURL = `http://localhost:5173/reset-password/${resetToken}`; 
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Password Reset Request',
            html: `
                <p>You are receiving this because a password reset was initiated for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>The link will expire in 24 hours.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        // 5. Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            message: `Password reset link sent to ${userEmail}` 
        });

    } catch (err) {
        // LOG THE SPECIFIC ERROR AND CHECK FOR DB/EMAIL FAILURES
        console.error('Password Reset Initiation Error:', err.message);
        
        let errorMessage = 'Failed to initiate password reset due to a server error.';

        if (err.message.includes('column "reset_password_token"')) {
            errorMessage = 'Database schema error: Missing "reset_password_token" or "reset_password_expires" columns.';
        } else if (err.message.includes('Nodemailer')) {
             errorMessage = 'Email service failed. Check EMAIL_USER, EMAIL_PASS, and App Password.';
        }
        
        res.status(500).json({ error: errorMessage });
    } finally {
        if (client) client.release();
    }
});


module.exports = router;