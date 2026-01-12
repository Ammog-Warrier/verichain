const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as pharma-cert (Org2)...');
        const { gateway, contract } = await connectToNetwork('Org2', 'pharma-cert');

        const assetId = `pharma_user_test_${Date.now()}`;

        console.log(`Creating asset ${assetId}...`);
        const assetData = {
            ID: assetId,
            status: 'MANUFACTURED',
            drugName: 'PharmaUserDrug',
            manufacturer: 'PharmaUserFactory'
        };
        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };
        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();
        console.log('Asset created.');

        console.log(`Reading asset ${assetId}...`);
        const result = await contract.evaluateTransaction('ReadPrivateAsset', 'PharmaCollection', assetId);
        console.log('Read result:', result.toString());

        await gateway.disconnect();
        console.log('SUCCESS: Pharma user verified.');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
