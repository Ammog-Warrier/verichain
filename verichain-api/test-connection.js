const { connectToNetwork } = require('./src/fabricGateway');

async function main() {
    console.log('--- VeriChain Connection Test ---');

    // Attempt to connect as Org1 Admin
    const connection = await connectToNetwork('org1', 'admin');

    if (connection) {
        console.log('✅ SUCCESS: Connected to verichain-channel');
        console.log('✅ SUCCESS: Contract "verichain-contract" located');

        // Clean up
        connection.gateway.disconnect();
        console.log('Disconnected safely.');
    } else {
        console.log('❌ FAILED: Check if "admin" identity exists in the wallet folder.');
    }
}

main();