const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
const { authenticateToken } = require('../middleware/auth');

// Create a private asset
router.post('/', authenticateToken, async (req, res) => {
    const { assetId, color, size, owner, appraisedValue, collection } = req.body;
    const { userId, orgName } = req.user;

    if (!assetId || !collection) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(orgName, userId);

        const assetData = {
            ID: assetId,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue
        };

        const assetDataString = JSON.stringify(assetData);
        const assetDataBuffer = Buffer.from(assetDataString);
        const assetDataInfo = Buffer.from(JSON.stringify({ asset_properties: assetDataBuffer.toString('base64') }));

        const transientData = {
            asset_properties: assetDataBuffer
        };

        console.log(`Submitting CreatePrivateAsset transaction for ${assetId}...`);

        // Note: The chaincode expects transient data with key 'asset_properties'
        // The value should be the JSON string of the asset properties
        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        await gateway.disconnect();

        res.status(201).json({ message: `Asset ${assetId} created successfully in ${collection}` });

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
