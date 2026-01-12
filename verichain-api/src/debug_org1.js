const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as admin-org1-cert (Org1)...');
        const { gateway, contract } = await connectToNetwork('Org1', 'admin-org1-cert');

        console.log('Connected. Creating a test Agri asset...');
        const assetId = `agri_test_${Date.now()}`;
        const assetData = {
            ID: assetId,
            status: 'HARVESTED',
            cropType: 'TestCrop',
            farmLocation: 'TestFarm'
        };

        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };

        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();

        console.log(`Asset ${assetId} created.`);

        console.log('Reading asset...');
        const result = await contract.evaluateTransaction('ReadPrivateAsset', 'AgriCollection', assetId);
        console.log('Read result:', result.toString());

        await gateway.disconnect();
        console.log('SUCCESS: Org1 access verified!');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
