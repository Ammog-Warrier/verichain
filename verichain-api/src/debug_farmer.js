const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as farmer02 (Org1)...');
        // This should now work with discovery disabled
        const { gateway, contract } = await connectToNetwork('Org1', 'farmer02');

        console.log('Connected. Creating a test Agri asset as farmer02...');
        const assetId = `farmer_test_${Date.now()}`;
        const assetData = {
            ID: assetId,
            status: 'HARVESTED',
            cropType: 'FarmerCrop',
            farmLocation: 'FarmerField'
        };

        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };

        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        console.log(`Asset ${assetId} created successfully by farmer02!`);
        await gateway.disconnect();

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
