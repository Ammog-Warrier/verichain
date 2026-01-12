/*
 * Import the pre-generated Org2 Admin identity from the crypto-config directory.
 */

'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Path to Org2 Admin credentials
        const credPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'Admin@org2.example.com', 'msp');
        const certPath = path.join(credPath, 'signcerts', 'Admin@org2.example.com-cert.pem');

        // Find the key file (it has a random name)
        const keyDir = path.join(credPath, 'keystore');
        const keyFiles = fs.readdirSync(keyDir);
        const keyPath = path.join(keyDir, keyFiles[0]);

        const certificate = fs.readFileSync(certPath).toString();
        const privateKey = fs.readFileSync(keyPath).toString();

        const identityLabel = 'admin-org2-cert';

        const identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };

        await wallet.put(identityLabel, identity);
        console.log(`Successfully imported ${identityLabel} into the wallet`);

    } catch (error) {
        console.error(`Failed to import identity: ${error}`);
        process.exit(1);
    }
}

main();
