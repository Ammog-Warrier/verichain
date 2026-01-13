/**
 * Inventory Routes - Retailer inventory management
 * 
 * Handles the Retailer's role in the supply chain:
 * - Viewing pending shipments
 * - Accepting verified shipments (HLF + PostgreSQL)
 * - Managing current inventory
 */

const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
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

/**
 * Accept a shipment into inventory
 * 
 * This is the critical endpoint that:
 * 1. Updates asset status on Hyperledger Fabric (MANUFACTURED -> STOCKED)
 * 2. Records acceptance in PostgreSQL for UI queries
 */
router.post('/', authenticateToken, async (req, res) => {
    const { userId, orgName } = req.user;
    const { assetId } = req.body;

    if (!assetId) {
        return res.status(400).json({ error: 'Missing required field: assetId' });
    }

    // Only Retailer (Org4) can accept inventory
    if (orgName !== 'Org4') {
        return res.status(403).json({ error: 'Only Retailer (Org4) can accept inventory' });
    }

    try {
        // 1. Update asset status on Hyperledger Fabric (Source of Truth)
        console.log(`Updating asset ${assetId} status to STOCKED on HLF...`);
        const { gateway, contract } = await connectToNetwork(orgName, userId);

        await contract.submitTransaction('UpdateAssetStatus', assetId, 'STOCKED');
        console.log(`Asset ${assetId} status updated on blockchain`);

        await gateway.disconnect();

        // 2. Record in PostgreSQL (Cache for UI)
        await db.query(
            'INSERT INTO inventory (asset_id, retailer_org) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [assetId, orgName]
        );

        // 3. Update asset status in PostgreSQL cache
        await db.query(
            'UPDATE assets SET status = $1 WHERE id = $2',
            ['STOCKED', assetId]
        );

        res.status(201).json({
            message: 'Shipment accepted and recorded on blockchain',
            assetId,
            status: 'STOCKED'
        });

    } catch (error) {
        console.error('Failed to accept shipment:', error);
        res.status(500).json({ error: `Failed to accept shipment: ${error.message}` });
    }
});

module.exports = router;
