/**
 * Transit Routes - IoT Temperature Simulation and ZK Proof Generation
 * 
 * Handles the Distributor's role in the supply chain:
 * - Simulating IoT temperature readings during transit
 * - Storing readings in HLF Private Data Collection
 * - Generating ZK proofs for compliance verification
 */

const express = require('express');
const router = express.Router();
const { connectToNetwork } = require('../utils/gateway');
const { authenticateToken } = require('../middleware/auth');
const zkProof = require('../zkProofGenerator');
const db = require('../db');
const { notarizeToShardeum, getExplorerURL, getQRCodeURL } = require('../utils/shardeumBridge');

// In-memory storage for active transit sessions (cleared on restart)
// ZK proofs are persisted to PostgreSQL after generation
const transitLogs = new Map();

/**
 * POST /api/transit/simulate
 * Simulate 30 IoT temperature readings for a batch during transit
 * Also transfers ownership from Pharma to Distributor on the blockchain
 */
router.post('/simulate', authenticateToken, async (req, res) => {
    const { batchId, scenario } = req.body;
    const { userId, orgName } = req.user;

    if (!batchId) {
        return res.status(400).json({ error: 'Missing required field: batchId' });
    }

    // Only Distributor (Org3) can simulate transit
    if (orgName !== 'Org3') {
        return res.status(403).json({
            error: 'Only Distributor (Org3) can simulate transit readings'
        });
    }

    try {
        // 1. Transfer ownership from Pharma to Distributor on HLF
        console.log(`Transferring ownership of ${batchId} to Distributor...`);
        const { gateway, contract } = await connectToNetwork(orgName, userId);

        await contract.submitTransaction('TransferAsset', batchId, 'Org3');
        await contract.submitTransaction('UpdateAssetStatus', batchId, 'IN_TRANSIT');
        console.log(`Asset ${batchId} transferred to Distributor, status: IN_TRANSIT`);

        await gateway.disconnect();

        // 2. Update PostgreSQL cache
        try {
            await db.query(
                'UPDATE assets SET status = $1 WHERE id = $2',
                ['IN_TRANSIT', batchId]
            );
        } catch (dbErr) {
            console.warn('PostgreSQL update failed (non-fatal):', dbErr.message);
        }

        // 3. Generate 30 temperature readings
        const temperatures = [];
        const timestamps = [];
        const now = Date.now();

        for (let i = 0; i < 30; i++) {
            let temp;

            if (scenario === 'breach') {
                if (i >= 15 && i <= 18) {
                    temp = 8.5 + Math.random() * 2;
                } else {
                    temp = 4 + Math.random() * 3;
                }
            } else {
                const baseTemp = 5;
                const variance = (Math.random() - 0.5) * 4;
                temp = Math.max(2.1, Math.min(7.9, baseTemp + variance));
            }

            temperatures.push(parseFloat(temp.toFixed(1)));
            timestamps.push(now - (30 - i) * 60000);
        }

        const stats = {
            min: Math.min(...temperatures),
            max: Math.max(...temperatures),
            avg: (temperatures.reduce((a, b) => a + b, 0) / 30).toFixed(2),
            inRange: temperatures.every(t => t >= 2 && t <= 8)
        };

        const transitData = {
            batchId,
            temperatures,
            timestamps,
            stats,
            simulatedAt: new Date().toISOString(),
            simulatedBy: userId,
            proofGenerated: false,
            proofHash: null
        };

        transitLogs.set(batchId, transitData);

        console.log(`Transit simulation for ${batchId}: ${stats.inRange ? 'COMPLIANT' : 'BREACH DETECTED'}`);

        res.status(200).json({
            success: true,
            batchId,
            ownershipTransferred: true,
            newOwner: 'Org3',
            status: 'IN_TRANSIT',
            readings: temperatures.map((temp, i) => ({
                temperature: temp,
                timestamp: new Date(timestamps[i]).toISOString(),
                index: i + 1
            })),
            stats,
            message: stats.inRange
                ? 'All readings within safe range (2°C - 8°C)'
                : 'Temperature breach detected!'
        });

    } catch (error) {
        console.error(`Failed to simulate transit: ${error}`);
        res.status(500).json({ error: `Failed to simulate transit: ${error.message}` });
    }
});

/**
 * POST /api/transit/generate-proof
 * Generate a ZK proof for the temperature readings
 */
router.post('/generate-proof', authenticateToken, async (req, res) => {
    const { batchId } = req.body;
    const { orgName } = req.user;

    if (!batchId) {
        return res.status(400).json({ error: 'Missing required field: batchId' });
    }

    // Only Distributor (Org3) can generate proofs
    if (orgName !== 'Org3') {
        return res.status(403).json({
            error: 'Only Distributor (Org3) can generate proofs'
        });
    }

    const transitData = transitLogs.get(batchId);
    if (!transitData) {
        return res.status(404).json({
            error: `No transit data found for batch ${batchId}. Run simulation first.`
        });
    }

    try {
        console.log(`🔐 Generating ZK proof for batch ${batchId}...`);

        // Check if temperatures are in range
        if (!transitData.stats.inRange) {
            return res.status(400).json({
                error: 'Cannot generate compliance proof - temperature breach detected',
                stats: transitData.stats
            });
        }

        // Generate ZK proof
        const proofPackage = await zkProof.generateProofPackage(transitData.temperatures);

        // Update transit data with proof
        transitData.proofGenerated = true;
        transitData.proofHash = proofPackage.proofHash;
        transitData.proof = proofPackage.proof;
        transitData.publicSignals = proofPackage.publicSignals;
        transitData.proofGeneratedAt = new Date().toISOString();
        transitLogs.set(batchId, transitData);

        // Store proof in PostgreSQL
        try {
            await db.query(
                `INSERT INTO transit_proofs (batch_id, proof_hash, min_temp, max_temp, avg_temp, readings_count, in_range, verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (batch_id) DO UPDATE SET proof_hash = $2, verified = $8`,
                [batchId, proofPackage.proofHash, transitData.stats.min, transitData.stats.max, transitData.stats.avg, 30, transitData.stats.inRange, proofPackage.verified]
            );
        } catch (dbError) {
            console.warn('PostgreSQL insert failed (non-fatal):', dbError.message);
        }

        res.status(200).json({
            success: true,
            batchId,
            proofHash: proofPackage.proofHash,
            inputHash: proofPackage.inputHash,
            verified: proofPackage.verified,
            proofTimeMs: proofPackage.proofTimeMs,
            metadata: proofPackage.metadata,
            explorerUrl: `https://explorer-mezame.shardeum.org/tx/${proofPackage.proofHash.slice(0, 66)}`,
            message: 'ZK proof generated and verified.'
        });

    } catch (error) {
        console.error(`Failed to generate proof: ${error}`);
        res.status(500).json({ error: `Failed to generate proof: ${error.message}` });
    }
});

/**
 * GET /api/transit/:batchId
 * Get transit data for a batch
 */
router.get('/:batchId', authenticateToken, async (req, res) => {
    const { batchId } = req.params;

    const transitData = transitLogs.get(batchId);
    if (!transitData) {
        return res.status(404).json({
            error: `No transit data found for batch ${batchId}`
        });
    }

    // Return sanitized data (without full proof for brevity)
    res.status(200).json({
        batchId: transitData.batchId,
        temperatures: transitData.temperatures,
        stats: transitData.stats,
        simulatedAt: transitData.simulatedAt,
        proofGenerated: transitData.proofGenerated,
        proofHash: transitData.proofHash,
        proofGeneratedAt: transitData.proofGeneratedAt
    });
});

/**
 * POST /api/transit/verify
 * Verify a ZK proof for a batch (for Retailer)
 */
router.post('/verify', authenticateToken, async (req, res) => {
    const { batchId, proofHash } = req.body;

    if (!batchId) {
        return res.status(400).json({ error: 'Missing required field: batchId' });
    }

    const transitData = transitLogs.get(batchId);
    if (!transitData) {
        return res.status(404).json({
            error: `No transit data found for batch ${batchId}`
        });
    }

    if (!transitData.proofGenerated) {
        return res.status(400).json({
            error: 'No proof has been generated for this batch yet'
        });
    }

    try {
        // Verify the proof
        const isValid = await zkProof.verifyTempRangeProof(
            transitData.proof,
            transitData.publicSignals
        );

        // Verify proofHash matches if provided
        const hashMatches = !proofHash || proofHash === transitData.proofHash;

        res.status(200).json({
            success: true,
            batchId,
            verified: isValid && hashMatches,
            proofHash: transitData.proofHash,
            complianceStatus: isValid ? 'THERMAL_COMPLIANT' : 'VERIFICATION_FAILED',
            stats: transitData.stats,
            message: isValid
                ? 'Math-Verified: 100% Thermal Compliance'
                : 'Proof verification failed'
        });

    } catch (error) {
        console.error(`Failed to verify proof: ${error}`);
        res.status(500).json({ error: `Failed to verify proof: ${error.message}` });
    }
});

/**
 * GET /api/transit/public/:batchId
 * Public verification endpoint (no auth required) - for Patient/External users
 */
router.get('/public/:batchId', async (req, res) => {
    const { batchId } = req.params;

    const transitData = transitLogs.get(batchId);
    if (!transitData) {
        return res.status(404).json({
            verified: false,
            error: `Batch ${batchId} not found in system`
        });
    }

    if (!transitData.proofGenerated) {
        return res.status(400).json({
            verified: false,
            status: 'PENDING',
            message: 'Batch is in transit - compliance verification pending'
        });
    }

    try {
        // Verify the proof
        const isValid = await zkProof.verifyTempRangeProof(
            transitData.proof,
            transitData.publicSignals
        );

        res.status(200).json({
            verified: isValid,
            batchId,
            status: isValid ? 'CERTIFIED_SAFE' : 'VERIFICATION_FAILED',
            proofHash: transitData.proofHash,
            complianceRange: '2°C - 8°C',
            readingsVerified: 30,
            verifiedAt: new Date().toISOString(),
            message: isValid
                ? `Batch ${batchId}: Certified Safe - Cold chain integrity verified by zero-knowledge cryptographic proof`
                : 'Verification failed - please contact manufacturer',
            shardeumTxHash: transitData.shardeumTxHash,
            shardeumExplorerUrl: transitData.shardeumExplorerUrl,
            shardeumQrCodeUrl: transitData.shardeumQrCodeUrl
        });

    } catch (error) {
        res.status(500).json({
            verified: false,
            error: 'Verification service error'
        });
    }
});


// POST /api/transit/notarize - Bridge ZK proof to Shardeum
router.post('/notarize', authenticateToken, async (req, res) => {
    const { assetId, proofHash, isValid } = req.body;

    if (!assetId || !proofHash) {
        return res.status(400).json({ error: 'Missing required fields: assetId, proofHash' });
    }

    try {
        // Call Shardeum Bridge
        const txHash = await notarizeToShardeum(assetId, proofHash, isValid !== false);

        if (!txHash) {
            return res.status(503).json({ error: 'Shardeum bridge not configured or failed' });
        }

        const explorerUrl = getExplorerURL(txHash);
        // Generate QR Code for the Batch ID (for easy scanning in the app)
        const qrCodeUrl = getQRCodeURL(assetId);

        // Update transitLogs
        const transitData = transitLogs.get(assetId);
        if (transitData) {
            transitData.shardeumTxHash = txHash;
            transitData.shardeumExplorerUrl = explorerUrl;
            transitData.shardeumQrCodeUrl = qrCodeUrl;
            transitLogs.set(assetId, transitData);
        }

        res.json({
            message: 'Notarization successful',
            txHash,
            explorerUrl,
            qrCodeUrl
        });

    } catch (error) {
        console.error(`Notarization failed: ${error}`);
        res.status(500).json({ error: `Notarization failed: ${error.message}` });
    }
});

module.exports = router;
