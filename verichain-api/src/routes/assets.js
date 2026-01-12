const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
const { authenticateToken } = require('../middleware/auth');

// Create a private asset (Unified Pharma Schema for both orgs)
router.post('/', authenticateToken, async (req, res) => {
    const { userId, orgName } = req.user;
    const { assetId, status } = req.body;

    if (!assetId) {
        return res.status(400).json({ error: 'Missing required field: assetId' });
    }

    // Unified Pharmaceutical Asset Schema for both Pharma1 and Pharma2
    const assetData = {
        ID: assetId,
        status: status || 'MANUFACTURED',
        // Drug Information
        drugName: req.body.drugName,
        genericName: req.body.genericName,
        dosageForm: req.body.dosageForm,
        strength: req.body.strength,
        // Manufacturing
        manufacturer: req.body.manufacturer,
        facilityLocation: req.body.facilityLocation,
        batchSize: req.body.batchSize,
        mfgDate: req.body.mfgDate,
        expiryDate: req.body.expiryDate,
        // Compliance
        cdscoLicenseNo: req.body.cdscoLicenseNo,
        labTestResult: req.body.labTestResult,
        productionCost: req.body.productionCost
    };

    const allowedOrgs = ['Org1', 'Org2', 'Org3', 'Org4'];
    if (!allowedOrgs.includes(orgName)) {
        return res.status(400).json({ error: `Organization ${orgName} is not authorized to create assets.` });
    }

    try {
        const { gateway, contract } = await connectToNetwork(orgName, userId);

        const assetDataString = JSON.stringify(assetData);
        const assetDataBuffer = Buffer.from(assetDataString);

        const transientData = {
            asset_properties: assetDataBuffer
        };

        console.log(`Submitting CreatePrivateAsset transaction for ${assetData.ID} as ${orgName}...`);

        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        await gateway.disconnect();

        res.status(201).json({ message: `Asset ${assetData.ID} created successfully`, assetId: assetData.ID });

    } catch (error) {
        console.error(`Failed to create asset: ${error}`);
        res.status(500).json({ error: `Failed to create asset: ${error.message}` });
    }
});

// Read a private asset
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { collection } = req.query;
    const { userId, orgName } = req.user;

    if (!collection) {
        return res.status(400).json({ error: 'Missing required query parameters: collection' });
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

    // No extra validation needed as userId/orgName come from token

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
