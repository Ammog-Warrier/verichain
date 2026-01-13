const { ethers } = require('ethers');
require('dotenv').config();

// Configuration from Environment Variables
const SHARDEUM_RPC_URL = process.env.SHARDEUM_RPC_URL || 'https://sphinx.shardeum.org/';
const PRIVATE_KEY = process.env.SHARDEUM_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.SHARDEUM_CONTRACT_ADDRESS;

// ABI of the Notary Contract
const CONTRACT_ABI = [
    "function notarize(string memory assetId, bytes32 dataHash, bool isValid) public",
    "event Notarized(string indexed assetId, bytes32 dataHash, bool isValid, uint256 timestamp)"
];

/**
 * Notarizes a ZK-proof validation result to the Shardeum Testnet.
 * @param {string} assetId - The Asset ID (e.g., VAX-001)
 * @param {string} dataHash - The hash of the data/proof (must be 32 bytes hex string)
 * @param {boolean} zkStatus - The result of the ZK verification
 * @returns {Promise<string>} - The Transaction Hash
 */
async function notarizeToShardeum(assetId, dataHash, zkStatus) {
    if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
        console.warn("Shardeum credentials not configured. Skipping notarization.");
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(SHARDEUM_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        console.log(`Notarizing asset ${assetId} to Shardeum...`);

        // Ensure dataHash is properly formatted as bytes32
        if (!dataHash.startsWith('0x')) {
            dataHash = '0x' + dataHash;
        }

        // Pad if necessary to 32 bytes (64 hex chars + 0x)
        if (dataHash.length < 66) {
            dataHash = ethers.zeroPadValue(dataHash, 32);
        }

        const tx = await contract.notarize(assetId, dataHash, zkStatus);
        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        return tx.hash;

    } catch (error) {
        console.error("Shardeum Notarization Failed:", error);
        throw error;
    }
}

/**
 * Generates a URL for the transaction on the Shardeum Explorer.
 * @param {string} txHash 
 * @returns {string}
 */
function getExplorerURL(txHash) {
    return `https://explorer-sphinx.shardeum.org/transaction/${txHash}`;
}

/**
 * Generates a QR Code URL (using Google Charts API for simplicity)
 * @param {string} data 
 * @returns {string}
 */
function getQRCodeURL(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
}

module.exports = {
    notarizeToShardeum,
    getExplorerURL,
    getQRCodeURL
};
