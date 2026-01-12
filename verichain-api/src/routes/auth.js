const express = require('express');
const router = express.Router();
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { getWallet } = require('../utils/wallet');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const { orgName, userId, adminId, role } = req.body;
    const userRole = role || 'client'; // Default to client if not specified

    if (!orgName || !userId || !adminId) {
        return res.status(400).json({ error: 'Missing required fields: orgName, userId, adminId' });
    }

    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'config', `connection-${orgName.toLowerCase()}.json`);

        if (!fs.existsSync(ccpPath)) {
            return res.status(404).json({ error: `Connection profile not found for ${orgName}` });
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities[`ca.${orgName.toLowerCase()}.example.com`];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Get the wallet
        const wallet = await getWallet();

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            return res.status(409).json({ error: `An identity for the user "${userId}" already exists in the wallet` });
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get(adminId);
        if (!adminIdentity) {
            return res.status(404).json({ error: `An identity for the admin user "${adminId}" does not exist in the wallet` });
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminId);

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: `${orgName.toLowerCase()}.department1`,
            enrollmentID: userId,
            role: 'client',
            attrs: [{ name: 'role', value: userRole, ecert: true }]
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${orgName}MSP`,
            type: 'X.509',
        };

        await wallet.put(userId, x509Identity);

        await wallet.put(userId, x509Identity);

        // Generate JWT
        const token = jwt.sign({ userId, orgName, role: userRole }, SECRET_KEY, { expiresIn: '1h' });

        res.status(201).json({
            message: `Successfully registered and enrolled user "${userId}"`,
            token
        });

    } catch (error) {
        console.error(`Failed to register user "${userId}": ${error}`);
        res.status(500).json({ error: `Failed to register user: ${error.message}` });
    }
});

router.post('/login', async (req, res) => {
    const { userId, orgName } = req.body;

    if (!userId || !orgName) {
        return res.status(400).json({ error: 'Missing required fields: userId, orgName' });
    }

    try {
        const wallet = await getWallet();
        const identity = await wallet.get(userId);

        if (!identity) {
            return res.status(401).json({ error: 'User not found in wallet. Please register first.' });
        }

        // TODO: Integrate with a secure password store or identity provider for password verification.
        // Currently relying on wallet identity existence.

        // We assume role is 'client' for existing users if not stored, 
        // but ideally we should store user metadata separately.
        // For now, let's default to 'client' or 'admin' if userId is 'admin' or 'OrgAdmin'.
        let role = 'client';
        if (userId.toLowerCase().includes('admin')) {
            role = 'admin';
        } else if (userId.toLowerCase().includes('farmer') || userId.toLowerCase().includes('producer') || userId.toLowerCase().includes('pharma')) {
            role = 'producer';
        } else if (userId.toLowerCase().includes('distributor')) {
            role = 'distributor';
        } else if (userId.toLowerCase().includes('retailer')) {
            role = 'retailer';
        } else if (userId.toLowerCase().includes('auditor')) {
            role = 'auditor';
        }

        const token = jwt.sign({ userId, orgName, role }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });

    } catch (error) {
        console.error(`Login failed for "${userId}": ${error}`);
        res.status(500).json({ error: `Login failed: ${error.message}` });
    }
});

module.exports = router;
