const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as farmer01 (Org1)...');
        // Try connecting with discovery disabled
        const { gateway, contract } = await connectToNetwork('Org1', 'farmer01', false);

        console.log('Connected. Attempting to query...');
        // Just try to evaluate a transaction to check access
        // We can try to read a non-existent asset just to check if we get past discovery
        try {
            await contract.evaluateTransaction('ReadAsset', 'non_existent_asset');
        } catch (e) {
            console.log('Query failed as expected (asset not found), but connection worked:', e.message);
        }

        await gateway.disconnect();

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
