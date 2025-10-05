// inventoryRoutes.js

const express = require('express');
const pool = require('./db'); // Import the database pool from db.js
const router = express.Router(); // Create a new router object

// ----------------------------------------
// --- API Routes for Inventory ---
// ----------------------------------------

// GET /api/inventory - Fetch all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, quantity FROM inventory ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
    res.status(500).send('Server Error fetching inventory');
  }
});

// POST /api/inventory - Add a new item to the inventory
router.post('/', async (req, res) => {
  const { name, quantity } = req.body;

  // Basic validation
  if (!name || quantity === undefined) {
    return res.status(400).json({ error: 'Missing item name or quantity' });
  }

  try {
    // SQL query with parameterized values ($1, $2) to prevent SQL injection
    const sql = 'INSERT INTO inventory (name, quantity) VALUES ($1, $2) RETURNING id, name, quantity';
    const values = [name, quantity];
    
    const result = await pool.query(sql, values);
    
    // Respond with the newly created item (including the DB-assigned ID)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding item:', err.message);
    res.status(500).send('Server Error adding item');
  }
});

module.exports = router;