/*
 * Import the pre-generated Admin identity as 'auditor-cert'.
 * This allows us to use a working identity for the Auditor role in the demo.
 */

'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function importAuditor(orgName, mspId, wallet) {
    try {
        console.log(`Importing Auditor for ${orgName}...`);

        // Path to Admin credentials
        const credPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', `${orgName.toLowerCase()}.example.com`, 'users', `Admin@${orgName.toLowerCase()}.example.com`, 'msp');
        const certPath = path.join(credPath, 'signcerts', `Admin@${orgName.toLowerCase()}.example.com-cert.pem`);

        const keyDir = path.join(credPath, 'keystore');
        const keyFiles = fs.readdirSync(keyDir);
        const keyPath = path.join(keyDir, keyFiles[0]);

        const certificate = fs.readFileSync(certPath).toString();
        const privateKey = fs.readFileSync(keyPath).toString();

        const identityLabel = `auditor-${orgName.toLowerCase()}-cert`;

        const identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: mspId,
            type: 'X.509',
        };

        await wallet.put(identityLabel, identity);
        console.log(`Successfully imported ${identityLabel} into the wallet`);

    } catch (error) {
        console.error(`Failed to import identity: ${error}`);
    }
}

async function main() {
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    await importAuditor('Org1', 'Org1MSP', wallet);
    await importAuditor('Org2', 'Org2MSP', wallet);
}

main();
