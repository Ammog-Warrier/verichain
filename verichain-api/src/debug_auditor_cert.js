const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as auditor-org1-cert (Org1)...');
        const { gateway, contract } = await connectToNetwork('Org1', 'auditor-org1-cert');

        console.log('Reading an asset...');
        try {
            // Try to read the asset created by farmer earlier
            const result = await contract.evaluateTransaction('ReadPrivateAsset', 'AgriCollection', 'frontend_test_123');
            console.log('Read result:', result.toString());
        } catch (e) {
            console.log('Read failed (might be missing asset, but connection worked):', e.message);
        }

        await gateway.disconnect();
        console.log('SUCCESS: Auditor verified.');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
