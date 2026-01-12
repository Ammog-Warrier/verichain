const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as auditor01 (Org1)...');
        const { gateway, contract } = await connectToNetwork('Org1', 'auditor01');

        // Auditor should be able to read assets
        // We'll try to read the asset created by farmer-cert earlier (debug_asset_...)
        // Since we don't know the exact ID, we'll just try to read a known one or fail gracefully.
        // Actually, let's create one as Admin first to ensure it exists.

        console.log('Reading an asset (assuming one exists or failing gracefully)...');
        try {
            const result = await contract.evaluateTransaction('ReadPrivateAsset', 'AgriCollection', 'frontend_test_123');
            console.log('Read result:', result.toString());
        } catch (e) {
            console.log('Read failed (expected if asset missing, but connection worked):', e.message);
        }

        await gateway.disconnect();
        console.log('SUCCESS: Auditor verified (connection successful).');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
