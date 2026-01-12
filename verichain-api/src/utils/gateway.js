const { Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { getWallet } = require('./wallet');

async function connectToNetwork(orgName, userName) {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'config', `connection-${orgName.toLowerCase()}.json`);

        if (!fs.existsSync(ccpPath)) {
            throw new Error(`Connection profile not found at ${ccpPath}`);
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Get the wallet
        const wallet = await getWallet();

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            throw new Error(`User ${userName} not found in wallet`);
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('verichain-channel');

        // Get the contract from the network.
        const contract = network.getContract('verichain-contract');

        return { gateway, network, contract };

    } catch (error) {
        console.error(`Failed to connect to network: ${error}`);
        throw error;
    }
}

module.exports = { connectToNetwork };
