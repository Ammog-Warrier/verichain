/**
 * Inventory Routes - Retailer inventory management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

// Get pending shipments (assets not yet in this retailer's inventory)
router.get('/pending', authenticateToken, async (req, res) => {
    const { orgName } = req.user;

    try {
        const result = await db.getAll(`
            SELECT a.* FROM assets a
            LEFT JOIN inventory i ON a.id = i.asset_id AND i.retailer_org = $1
            WHERE i.asset_id IS NULL
            ORDER BY a.created_at DESC
            LIMIT 50
        `, [orgName]);

        res.json(result);
    } catch (error) {
        console.error('Failed to get pending shipments:', error);
        res.status(500).json({ error: 'Failed to get pending shipments' });
    }
});

// Get retailer's inventory
router.get('/', authenticateToken, async (req, res) => {
    const { orgName } = req.user;

    try {
        const result = await db.getAll(`
            SELECT a.*, i.accepted_at FROM inventory i
            JOIN assets a ON i.asset_id = a.id
            WHERE i.retailer_org = $1
            ORDER BY i.accepted_at DESC
        `, [orgName]);

        res.json(result);
    } catch (error) {
        console.error('Failed to get inventory:', error);
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

// Accept a shipment into inventory
router.post('/', authenticateToken, async (req, res) => {
    const { orgName } = req.user;
    const { assetId } = req.body;

    if (!assetId) {
        return res.status(400).json({ error: 'Missing required field: assetId' });
    }

    try {
        // Check if asset exists
        const asset = await db.getOne('SELECT id FROM assets WHERE id = $1', [assetId]);
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Insert into inventory
        await db.query(
            'INSERT INTO inventory (asset_id, retailer_org) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [assetId, orgName]
        );

        res.status(201).json({ message: 'Shipment accepted into inventory', assetId });
    } catch (error) {
        console.error('Failed to accept shipment:', error);
        res.status(500).json({ error: 'Failed to accept shipment' });
    }
});

module.exports = router;
