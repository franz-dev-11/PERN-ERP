const router = require('express').Router();
const pool = require('./db'); // Assuming '../db' is your PostgreSQL connection pool

// @route GET /api/purchasing/suppliers (Unchanged)
// Retrieves all supplier data.
router.get('/suppliers', async (req, res) => {
    try {
        const allSuppliers = await pool.query("SELECT * FROM suppliers ORDER BY name ASC");
        res.json(allSuppliers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error fetching suppliers");
    }
});

// @route GET /api/purchasing/hardware (Unchanged)
// Retrieves all hardware items, optionally filtered by supplierId, including new columns.
router.get('/hardware', async (req, res) => {
    try {
        const { supplierId } = req.query; 
        
        let queryText = `
            SELECT 
                h.hardware_id, 
                h.name, 
                h.description, 
                h.price, 
                h.stock_quantity, 
                h.supplier_id,
                
                h.item_type, 
                h.uom, 
                h.storage_location, 
                h.locator_bin,
                
                s.name AS supplier_name
            FROM hardware h
            JOIN suppliers s ON h.supplier_id = s.supplier_id
        `;
        let queryParams = [];

        if (supplierId) {
            queryText += ` WHERE h.supplier_id = $1`;
            queryParams.push(supplierId);
        }

        queryText += ` ORDER BY h.hardware_id DESC`;

        const allHardware = await pool.query(queryText, queryParams);
        res.json(allHardware.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error fetching hardware");
    }
});

// @route POST /api/purchasing/order (Unchanged)
// Handles a purchase order: increments stock quantity in a transaction.
router.post('/order', async (req, res) => {
    // ... (logic remains the same)
});


// ----------------------------------------------------------------------
// @route PUT /api/inventory/update-field
// NEW ROUTE: Allows updating a single field (location or bin) inline.
// ----------------------------------------------------------------------
router.put('/inventory/update-field', async (req, res) => {
    try {
        const { hardwareId, field, value } = req.body;

        // Basic validation to ensure only allowed fields are updated
        if (!['storage_location', 'locator_bin'].includes(field)) {
            return res.status(400).json({ message: "Invalid field for update." });
        }

        // Construct the query dynamically using the field name
        const updateQuery = `
            UPDATE hardware
            SET ${field} = $1
            WHERE hardware_id = $2
            RETURNING *;
        `;
        
        const result = await pool.query(updateQuery, [value, hardwareId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Hardware item not found." });
        }

        res.json({ message: `${field} updated successfully.`, item: result.rows[0] });

    } catch (err) {
        console.error("Error updating hardware field:", err.message);
        res.status(500).send("Server Error updating inventory field.");
    }
});

module.exports = router;