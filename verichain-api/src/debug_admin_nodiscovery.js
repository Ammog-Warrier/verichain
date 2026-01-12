const { connectToNetwork } = require('./utils/gateway');

async function main() {
    try {
        console.log('Connecting as OrgAdmin (Org1) with discovery disabled...');
        // connectToNetwork now has discovery: { enabled: false } hardcoded in gateway.js
        const { gateway, contract } = await connectToNetwork('Org1', 'OrgAdmin');

        const assetId = `admin_nodisc_${Date.now()}`;

        console.log(`Creating asset ${assetId}...`);
        const assetData = {
            ID: assetId,
            status: 'HARVESTED',
            cropType: 'AdminCrop',
            farmLocation: 'AdminField'
        };
        const transientData = {
            asset_properties: Buffer.from(JSON.stringify(assetData))
        };
        await contract.createTransaction('CreatePrivateAsset')
            .setTransient(transientData)
            .submit();
        console.log('Asset created.');

        await gateway.disconnect();
        console.log('SUCCESS: OrgAdmin works with discovery disabled.');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

main();
