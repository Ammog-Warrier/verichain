/*
 * Import the pre-generated User1 identity for Org2 from the crypto-config directory.
 * We will label this identity as 'pharma-cert' to represent a standard pharma user.
 */

'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Path to User1 credentials for Org2
        const credPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'User1@org2.example.com', 'msp');
        const certPath = path.join(credPath, 'signcerts', 'User1@org2.example.com-cert.pem');

        const keyDir = path.join(credPath, 'keystore');
        const keyFiles = fs.readdirSync(keyDir);
        const keyPath = path.join(keyDir, keyFiles[0]);

        const certificate = fs.readFileSync(certPath).toString();
        const privateKey = fs.readFileSync(keyPath).toString();

        const identityLabel = 'pharma-cert';

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
