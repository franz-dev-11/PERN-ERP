// userRoutes.js (Backend - Node.js/Express) - FINAL VERSION

const express = require('express');
const pool = require('./db'); // Assuming './db' exports the PostgreSQL connection pool
const bcrypt = require('bcryptjs'); // Required for hashing passwords on update
const router = express.Router();

// Constant for password hashing, matched to authRoutes.js
const SALT_ROUNDS = 10; 


// ------------------------------------------------------------------------
// 1. GET /users - Fetch all users
// ------------------------------------------------------------------------

router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            // Select the status column directly
            `SELECT user_id AS id, username, full_name, email, role_id, status 
             FROM Users 
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
        res.status(500).json({ error: 'Failed to fetch users from database.' });
    }
});


// ------------------------------------------------------------------------
// 2. PATCH /users/:id - Update a specific user's data (The Edit Function)
// ------------------------------------------------------------------------

router.patch('/users/:id', async (req, res) => {
    const { id } = req.params;
    // Fields expected from the frontend payload (Users.jsx)
    const { full_name, username, email, role_id, status, password } = req.body; 
    let client;
    
    try {
        client = await pool.connect();
        let queryParts = [];
        let queryValues = [];
        let valueIndex = 1;

        // --- Dynamic Query Builder (Only processes fields present in the payload) ---
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
        
        // Handle optional password update
        if (password) {
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
            UPDATE Users 
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
        // Log the actual database error on the server side
        console.error('Server Error during user update:', err.message); 
        
        // CRITICAL FIX: Send the actual database error message to the frontend for diagnosis.
        const errorMessage = err.detail || err.message;
        
        res.status(500).json({ 
            error: `Failed to update user data. Error detail: ${errorMessage}` 
        });
    } finally {
        if (client) client.release();
    }
});


module.exports = router;