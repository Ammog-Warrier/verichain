/*
 * Register and enroll Auditor users for both Orgs.
 * Uses the CA Admin ('admin') for each org.
 */

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function registerAuditor(orgName, userId, caUrl, caName, mspId, wallet) {
    try {
        console.log(`\n--- Processing ${userId} for ${orgName} ---`);

        // Load Connection Profile
        const ccpPath = path.resolve(__dirname, 'config', `connection-${orgName.toLowerCase()}.json`);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Connect to CA
        const caInfo = ccp.certificateAuthorities[caName];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Enroll CA Admin if not in wallet (we need it to register others)
        // We assume 'admin' is the CA admin username for both.
        const adminId = `admin-${orgName.toLowerCase()}-ca`; // Unique label for wallet

        let adminUser = await wallet.get(adminId);
        if (!adminUser) {
            console.log(`Enrolling CA Admin for ${orgName}...`);
            const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: mspId,
                type: 'X.509',
            };
            await wallet.put(adminId, x509Identity);
            adminUser = await wallet.get(adminId);
            console.log(`CA Admin enrolled as ${adminId}`);
        }

        const provider = wallet.getProviderRegistry().getProvider(adminUser.type);
        const adminUserContext = await provider.getUserContext(adminUser, adminId);

        // Register User
        // Check if already exists? CA throws error.
        try {
            console.log(`Registering ${userId}...`);
            const secret = await ca.register({
                affiliation: `${orgName.toLowerCase()}.department1`,
                enrollmentID: userId,
                role: 'client',
                attrs: [{ name: 'role', value: 'auditor', ecert: true }]
            }, adminUserContext);
            console.log(`Registered. Secret: ${secret}`);

            // Enroll
            console.log(`Enrolling ${userId}...`);
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            // Import
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: mspId,
                type: 'X.509',
            };
            await wallet.put(userId, x509Identity);
            console.log(`Successfully imported ${userId}`);

        } catch (error) {
            if (error.toString().includes('already registered')) {
                console.log(`User ${userId} already registered. Skipping... (If not in wallet, this is an issue)`);
                // In a real script we'd handle re-enrollment if we had the secret, but here we assume fresh or success.
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error(`Failed to process ${userId}: ${error}`);
    }
}

async function main() {
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    await registerAuditor('Org1', 'auditor01', 'https://localhost:7054', 'ca.org1.example.com', 'Org1MSP', wallet);
    await registerAuditor('Org2', 'auditor02', 'https://localhost:8054', 'ca.org2.example.com', 'Org2MSP', wallet);
}

main();
