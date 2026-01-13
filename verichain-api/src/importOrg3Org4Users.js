'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Path to the wallet where identities are stored
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Import Org3 User1 as distributor-cert
        const org3CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/signcerts/User1@org3.example.com-cert.pem');
        const org3KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/keystore');

        if (!fs.existsSync(org3CertPath)) {
            console.log('Org3 User1 certificate not found at:', org3CertPath);
            return;
        }

        const org3Cert = fs.readFileSync(org3CertPath).toString();
        const org3KeyFiles = fs.readdirSync(org3KeyDir);
        const org3Key = fs.readFileSync(path.join(org3KeyDir, org3KeyFiles[0])).toString();

        const org3Identity = {
            credentials: {
                certificate: org3Cert,
                privateKey: org3Key,
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };

        await wallet.put('distributor-cert', org3Identity);
        console.log('Successfully imported distributor-cert into the wallet');

        // Import Org4 User1 as retailer-cert
        const org4CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org4.example.com/users/User1@org4.example.com/msp/signcerts/User1@org4.example.com-cert.pem');
        const org4KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org4.example.com/users/User1@org4.example.com/msp/keystore');

        if (!fs.existsSync(org4CertPath)) {
            console.log('Org4 User1 certificate not found at:', org4CertPath);
            return;
        }

        const org4Cert = fs.readFileSync(org4CertPath).toString();
        const org4KeyFiles = fs.readdirSync(org4KeyDir);
        const org4Key = fs.readFileSync(path.join(org4KeyDir, org4KeyFiles[0])).toString();

        const org4Identity = {
            credentials: {
                certificate: org4Cert,
                privateKey: org4Key,
            },
            mspId: 'Org4MSP',
            type: 'X.509',
        };

        await wallet.put('retailer-cert', org4Identity);
        console.log('Successfully imported retailer-cert into the wallet');

    } catch (error) {
        console.error(`Failed to import identities: ${error}`);
        process.exit(1);
    }
}

main();
