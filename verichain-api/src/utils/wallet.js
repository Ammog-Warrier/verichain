const { Wallets } = require('fabric-network');
const path = require('path');

async function getWallet() {
    const walletPath = path.join(__dirname, '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    return wallet;
}

module.exports = { getWallet };
