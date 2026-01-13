/*
 * Restore Identities Script
 * Imports cryptogen-generated certificates into the wallet for demo users.
 */

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(process.cwd(), 'src', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const organizations = [
            {
                name: 'Org1',
                mspId: 'Org1MSP',
                users: [
                    { id: 'admin-org1', path: 'Admin@org1.example.com' },
                    { id: 'pharma1-cert', path: 'User1@org1.example.com' }
                ]
            },
            {
                name: 'Org2',
                mspId: 'Org2MSP',
                users: [
                    { id: 'admin-org2', path: 'Admin@org2.example.com' },
                    { id: 'pharma2-cert', path: 'User1@org2.example.com' }
                ]
            },
            {
                name: 'Org3',
                mspId: 'Org3MSP',
                users: [
                    { id: 'admin-org3', path: 'Admin@org3.example.com' },
                    { id: 'distributor-cert', path: 'User1@org3.example.com' }
                ]
            },
            {
                name: 'Org4',
                mspId: 'Org4MSP',
                users: [
                    { id: 'admin-org4', path: 'Admin@org4.example.com' },
                    { id: 'retailer-cert', path: 'User1@org4.example.com' }
                ]
            }
        ];

        for (const org of organizations) {
            console.log(`Processing ${org.name}...`);

            for (const user of org.users) {
                const credPath = path.resolve(__dirname, '..', 'organizations', 'peerOrganizations', `${org.name.toLowerCase()}.example.com`, 'users', user.path, 'msp');
                const certPath = path.join(credPath, 'signcerts', `${user.path}-cert.pem`);
                const keyPath = path.join(credPath, 'keystore');

                if (!fs.existsSync(certPath)) {
                    console.error(`Certificate not found for ${user.id} at ${certPath}`);
                    continue;
                }

                const keyFiles = fs.readdirSync(keyPath);
                if (keyFiles.length === 0) {
                    console.error(`Private key not found for ${user.id} at ${keyPath}`);
                    continue;
                }
                const privateKeyPath = path.join(keyPath, keyFiles[0]);

                const certificate = fs.readFileSync(certPath).toString();
                const privateKey = fs.readFileSync(privateKeyPath).toString();

                const identity = {
                    credentials: {
                        certificate,
                        privateKey,
                    },
                    mspId: org.mspId,
                    type: 'X.509',
                };

                await wallet.put(user.id, identity);
                console.log(`Successfully imported identity for ${user.id}`);
            }
        }

        console.log('Identity restoration complete!');

    } catch (error) {
        console.error(`Error restoring identities: ${error}`);
        process.exit(1);
    }
}

main();
