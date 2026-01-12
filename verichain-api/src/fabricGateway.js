const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function connectToNetwork(orgName, userName) {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', `${orgName.toLowerCase()}.example.com`, `connection-${orgName.toLowerCase()}.json`);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: false, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('verichain-channel');

        // Get the contract from the network.
        const contract = network.getContract('verichain-contract');

        return { gateway, network, contract };

    } catch (error) {
        console.error(`Failed to connect to network: ${error}`);
    }
}

module.exports = { connectToNetwork };
