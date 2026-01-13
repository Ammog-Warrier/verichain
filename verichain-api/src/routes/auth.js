const express = require('express');
const router = express.Router();
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { getWallet } = require('../utils/wallet');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, authenticateToken } = require('../middleware/auth');

// Cookie options for JWT
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
};

router.post('/register', async (req, res) => {
    const { orgName, userId, adminId, role } = req.body;
    const userRole = role || 'client';

    if (!orgName || !userId || !adminId) {
        return res.status(400).json({ error: 'Missing required fields: orgName, userId, adminId' });
    }

    try {
        const ccpPath = path.resolve(__dirname, '..', 'config', `connection-${orgName.toLowerCase()}.json`);

        if (!fs.existsSync(ccpPath)) {
            return res.status(404).json({ error: `Connection profile not found for ${orgName}` });
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const caInfo = ccp.certificateAuthorities[`ca.${orgName.toLowerCase()}.example.com`];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const wallet = await getWallet();

        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            return res.status(409).json({ error: `User "${userId}" already exists` });
        }

        const adminIdentity = await wallet.get(adminId);
        if (!adminIdentity) {
            return res.status(404).json({ error: `Admin "${adminId}" not found` });
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminId);

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

        const token = jwt.sign({ userId, orgName, role: userRole }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, COOKIE_OPTIONS);

        res.status(201).json({
            message: `User "${userId}" registered successfully`,
            user: { userId, orgName, role: userRole }
        });

    } catch (error) {
        console.error(`Failed to register user "${userId}": ${error}`);
        res.status(500).json({ error: `Registration failed: ${error.message}` });
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
            return res.status(401).json({ error: 'User not found. Please register first.' });
        }

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

        // Set HTTP-only cookie
        res.cookie('token', token, COOKIE_OPTIONS);

        // Also return token in body for backward compatibility
        res.json({
            message: 'Login successful',
            token,
            user: { userId, orgName, role }
        });

    } catch (error) {
        console.error(`Login failed for "${userId}": ${error}`);
        res.status(500).json({ error: `Login failed: ${error.message}` });
    }
});

// Get current user from cookie
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Logout - clear cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token', COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
