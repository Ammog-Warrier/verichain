const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

// Create a private asset (Unified Pharma Schema)
router.post('/', authenticateToken, async (req, res) => {
    const { userId, orgName } = req.user;
    const { assetId, status } = req.body;

    if (!assetId) {
        return res.status(400).json({ error: 'Missing required field: assetId' });
    }

    const assetData = {
        ID: assetId,
        status: status || 'MANUFACTURED',
        drugName: req.body.drugName,
        genericName: req.body.genericName,
        dosageForm: req.body.dosageForm,
        strength: req.body.strength,
        manufacturer: req.body.manufacturer,
        facilityLocation: req.body.facilityLocation,
        batchSize: req.body.batchSize,
        mfgDate: req.body.mfgDate,
        expiryDate: req.body.expiryDate,
        cdscoLicenseNo: req.body.cdscoLicenseNo,
        labTestResult: req.body.labTestResult,
        productionCost: req.body.productionCost
    };

    const allowedOrgs = ['Org1', 'Org2', 'Org3', 'Org4'];
    if (!allowedOrgs.includes(orgName)) {
        return res.status(400).json({ error: `Organization ${orgName} is not authorized to create assets.` });
    }

    try {
        // 1. Commit to Hyperledger Fabric (source of truth)
        const { gateway, contract } = await connectToNetwork(orgName, userId);

        const assetDataString = JSON.stringify(assetData);
        const assetDataBuffer = Buffer.from(assetDataString);

        const transientData = {
            asset_properties: assetDataBuffer
        };

        console.log(`Submitting CreatePrivateAsset transaction for ${assetData.ID}...`);
        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        await gateway.disconnect();

        // 2. Insert into PostgreSQL (cache for UI queries)
        try {
            await db.query(
                `INSERT INTO assets (id, drug_name, cdsco_license_no, batch_size, manufacturer, org_name, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO UPDATE SET status = $7`,
                [assetId, assetData.drugName, assetData.cdscoLicenseNo, assetData.batchSize, assetData.manufacturer, orgName, assetData.status]
            );
        } catch (dbError) {
            console.warn('PostgreSQL insert failed (non-fatal):', dbError.message);
        }

        res.status(201).json({ message: `Asset ${assetData.ID} created successfully`, assetId: assetData.ID });

    } catch (error) {
        console.error(`Failed to create asset: ${error}`);
        res.status(500).json({ error: `Failed to create asset: ${error.message}` });
    }
});

// List assets by org (from PostgreSQL)
router.get('/', authenticateToken, async (req, res) => {
    const { orgName } = req.user;
    const filterOrg = req.query.org || orgName;

    try {
        const result = await db.getAll(
            'SELECT * FROM assets WHERE org_name = $1 ORDER BY created_at DESC LIMIT 50',
            [filterOrg]
        );
        res.json(result);
    } catch (error) {
        console.error('Failed to list assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
});

// Read a private asset from HLF
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { collection } = req.query;
    const { userId, orgName } = req.user;

    if (!collection) {
        return res.status(400).json({ error: 'Missing required query parameter: collection' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(orgName, userId);
        console.log(`Evaluating ReadPrivateAsset transaction for ${id}...`);
        const result = await contract.evaluateTransaction('ReadPrivateAsset', collection, id);
        await gateway.disconnect();
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Failed to read asset: ${error}`);
        res.status(500).json({ error: `Failed to read asset: ${error.message}` });
    }
});

// Read public asset summary
router.get('/public/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId, orgName } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(orgName, userId);
        console.log(`Evaluating ReadAsset transaction for ${id}...`);
        const result = await contract.evaluateTransaction('ReadAsset', id);
        await gateway.disconnect();
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Failed to read public asset: ${error}`);
        res.status(500).json({ error: `Failed to read public asset: ${error.message}` });
    }
});

module.exports = router;
