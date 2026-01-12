const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
const { authenticateToken } = require('../middleware/auth');

// Create a private asset (Agri or Pharma based on org)
router.post('/', authenticateToken, async (req, res) => {
    const { userId, orgName } = req.user;
    const { assetId, status } = req.body;

    if (!assetId) {
        return res.status(400).json({ error: 'Missing required field: assetId' });
    }

    let assetData = {
        ID: assetId,
        status: status
    };

    // Extract fields based on Organization
    if (orgName === 'Org1') {
        // Agriculture Schema
        assetData = {
            ...assetData,
            cropType: req.body.cropType,
            variety: req.body.variety,
            harvestDate: req.body.harvestDate,
            farmLocation: req.body.farmLocation,
            farmerName: req.body.farmerName,
            quantity: req.body.quantity,
            organicCertified: req.body.organicCertified,
            fertilizersUsed: req.body.fertilizersUsed,
            pesticideCompliance: req.body.pesticideCompliance,
            soilPH: req.body.soilPH,
            estimatedValue: req.body.estimatedValue
        };
    } else if (orgName === 'Org2') {
        // Pharmaceutical Schema
        assetData = {
            ...assetData,
            drugName: req.body.drugName,
            genericName: req.body.genericName,
            dosageForm: req.body.dosageForm,
            strength: req.body.strength,
            mfgDate: req.body.mfgDate,
            expiryDate: req.body.expiryDate,
            batchSize: req.body.batchSize,
            manufacturer: req.body.manufacturer,
            facilityLocation: req.body.facilityLocation,
            labTestResult: req.body.labTestResult,
            cdscoLicenseNo: req.body.cdscoLicenseNo,
            productionCost: req.body.productionCost
        };
    } else {
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
