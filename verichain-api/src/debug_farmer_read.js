const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as farmer-cert (Org1)...');
        const { gateway, contract } = await connectToNetwork('Org1', 'farmer-cert');

        const assetId = `debug_asset_${Date.now()}`;

        console.log(`Creating asset ${assetId}...`);
        const assetData = {
            ID: assetId,
            status: 'HARVESTED',
            cropType: 'DebugCrop',
            farmLocation: 'DebugField'
        };
        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };
        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();
        console.log('Asset created.');

        console.log(`Reading asset ${assetId}...`);
        const result = await contract.evaluateTransaction('ReadPrivateAsset', 'AgriCollection', assetId);
        console.log('Read result:', result.toString());

        await gateway.disconnect();
        console.log('SUCCESS: Read verified.');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
