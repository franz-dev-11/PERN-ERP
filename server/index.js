// index.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcryptjs'); 

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// --- Imports for Modular Structure ---
// Import db.js to initiate the database connection and export the pool
require('./db'); 
const inventoryRoutes = require('./inventoryRoutes'); 
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes'); // The new file we created
// -------------------------------------

// --- Middleware ---

// 1. Configure CORS to allow access from the React development server (port 5173)
app.use(cors({
    origin: 'http://localhost:5173', // Must match your React app's port
    methods: ['GET', 'PATCH', 'POST', 'DELETE'], // PATCH must be allowed
    credentials: true,
}));

// 2. Middleware for parsing application/json bodies
app.use(express.json()); 

// ----------------------------------------
// --- API Routes ---
// ----------------------------------------

// Use the imported inventory routes and apply them to the base path /api/inventory
app.use('/api/inventory', inventoryRoutes);

// Use the imported authentication routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);


// ❌ REMOVED: The duplicate cors block was here.

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});