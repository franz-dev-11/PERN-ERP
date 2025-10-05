// db.js

const { Pool } = require('pg');

// Use the IP defined in .env or default to 127.0.0.1
const API_IP = process.env.PGHOST || '127.0.0.1'; 

// --- PostgreSQL Setup ---
const pool = new Pool({
  user: process.env.PGUSER,
  host: API_IP,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(res => console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now))
  .catch(err => console.error('❌ Error connecting to the database:', err.message));

// Export the pool so it can be used by the API routes
module.exports = pool;