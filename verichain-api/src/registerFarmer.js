/*
 * Register and enroll a user (farmer01) against the current CA.
 * Uses OrgAdmin (canonical) to perform the registration.
 */

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 1. Setup Wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userId = 'farmer01';
        const adminId = 'admin'; // Use CA Admin for registration
        const orgName = 'Org1';

        // 2. Remove old identity if exists
        const identity = await wallet.get(userId);
        if (identity) {
            console.log(`Removing stale identity for ${userId}...`);
            await wallet.remove(userId);
        }

        // 3. Load Connection Profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // 4. Connect to CA
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // 5. Get Admin User Context
        const adminIdentity = await wallet.get(adminId);
        if (!adminIdentity) {
            console.error(`Admin identity ${adminId} not found in wallet. Run importOrg1Admin.js first.`);
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminId);

        // 6. Register User
        console.log(`Registering ${userId}...`);
        try {
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: userId,
                role: 'client',
                attrs: [{ name: 'role', value: 'producer', ecert: true }]
            }, adminUser);
            console.log(`Successfully registered ${userId}. Secret: ${secret}`);

            // 7. Enroll User
            console.log(`Enrolling ${userId}...`);
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            // 8. Import into Wallet
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
            await wallet.put(userId, x509Identity);
            console.log(`Successfully enrolled and imported ${userId} into wallet.`);

        } catch (error) {
            if (error.toString().includes('already registered')) {
                console.log(`User ${userId} is already registered. Attempting to re-enroll...`);
                // If already registered but not in wallet (or we deleted it), we need the secret.
                // But we don't have the secret if we didn't just register.
                // However, for standard Fabric CA, you can't retrieve the secret again.
                // We might need to register a NEW user if we lost the secret, OR assume the secret is default if set (unlikely).
                // Actually, if it's already registered, we can try to enroll if we knew the secret.
                // Since this is a dev env, we can't easily reset just one user without resetting CA.
                // ALTERNATIVE: Register 'farmer02' or similar if 'farmer01' is stuck.
                // OR: Just use OrgAdmin for the demo.

                // Let's try to enroll with a known secret if we set one? No, register generates it.
                // Wait, if we are admin, we can re-register? No.

                console.log("Cannot re-retrieve secret for already registered user. Creating 'farmer02' instead to ensure a working identity.");
                await registerNewUser('farmer02', adminUser, ca, wallet);
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error(`Failed to register/enroll: ${error}`);
        process.exit(1);
    }
}

async function registerNewUser(newUserId, adminUser, ca, wallet) {
    console.log(`Registering ${newUserId}...`);
    const secret = await ca.register({
        affiliation: 'org1.department1',
        enrollmentID: newUserId,
        role: 'client',
        attrs: [{ name: 'role', value: 'producer', ecert: true }]
    }, adminUser);

    const enrollment = await ca.enroll({
        enrollmentID: newUserId,
        enrollmentSecret: secret
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    await wallet.put(newUserId, x509Identity);
    console.log(`Successfully enrolled and imported ${newUserId} into wallet.`);
}

main();
