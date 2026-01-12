const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as admin-org2-cert (Org2)...');
        const { gateway, contract } = await connectToNetwork('Org2', 'admin-org2-cert');

        console.log('Connected. Creating a test Pharma asset...');
        const assetId = `pharma_test_${Date.now()}`;
        const assetData = {
            ID: assetId,
            status: 'MANUFACTURED',
            drugName: 'TestDrug',
            manufacturer: 'Org2Factory'
        };

        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };

        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        console.log(`Asset ${assetId} created.`);

        console.log('Reading asset...');
        const result = await contract.evaluateTransaction('ReadPrivateAsset', 'PharmaCollection', assetId);
        console.log('Read result:', result.toString());

        await gateway.disconnect();

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
