'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Import Org1 User1 as pharma1-cert
        const org1CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem');
        const org1KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore');

        const org1Cert = fs.readFileSync(org1CertPath).toString();
        const org1KeyFiles = fs.readdirSync(org1KeyDir);
        const org1Key = fs.readFileSync(path.join(org1KeyDir, org1KeyFiles[0])).toString();

        await wallet.put('pharma1-cert', { credentials: { certificate: org1Cert, privateKey: org1Key }, mspId: 'Org1MSP', type: 'X.509' });
        console.log('Successfully imported pharma1-cert');

        // Import Org2 User1 as pharma2-cert
        const org2CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/signcerts/User1@org2.example.com-cert.pem');
        const org2KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/keystore');

        const org2Cert = fs.readFileSync(org2CertPath).toString();
        const org2KeyFiles = fs.readdirSync(org2KeyDir);
        const org2Key = fs.readFileSync(path.join(org2KeyDir, org2KeyFiles[0])).toString();

        await wallet.put('pharma2-cert', { credentials: { certificate: org2Cert, privateKey: org2Key }, mspId: 'Org2MSP', type: 'X.509' });
        console.log('Successfully imported pharma2-cert');

        // Import Org3 User1 as distributor-cert
        const org3CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/signcerts/User1@org3.example.com-cert.pem');
        const org3KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/keystore');

        const org3Cert = fs.readFileSync(org3CertPath).toString();
        const org3KeyFiles = fs.readdirSync(org3KeyDir);
        const org3Key = fs.readFileSync(path.join(org3KeyDir, org3KeyFiles[0])).toString();

        await wallet.put('distributor-cert', { credentials: { certificate: org3Cert, privateKey: org3Key }, mspId: 'Org3MSP', type: 'X.509' });
        console.log('Successfully imported distributor-cert');

        // Import Org4 User1 as retailer-cert
        const org4CertPath = path.join(__dirname, '../../organizations/peerOrganizations/org4.example.com/users/User1@org4.example.com/msp/signcerts/User1@org4.example.com-cert.pem');
        const org4KeyDir = path.join(__dirname, '../../organizations/peerOrganizations/org4.example.com/users/User1@org4.example.com/msp/keystore');

        const org4Cert = fs.readFileSync(org4CertPath).toString();
        const org4KeyFiles = fs.readdirSync(org4KeyDir);
        const org4Key = fs.readFileSync(path.join(org4KeyDir, org4KeyFiles[0])).toString();

        await wallet.put('retailer-cert', { credentials: { certificate: org4Cert, privateKey: org4Key }, mspId: 'Org4MSP', type: 'X.509' });
        console.log('Successfully imported retailer-cert');

        console.log('All 4 org identities imported successfully!');
    } catch (error) {
        console.error(`Failed: ${error}`);
        process.exit(1);
    }
}

main();
