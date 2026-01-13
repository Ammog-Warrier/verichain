/**
 * Real ZK-SNARK Proof Generator using snarkjs Groth16
 * 
 * This module generates cryptographic proofs that temperature readings
 * are within the safe range (2°C - 8°C) without revealing the actual values.
 */

const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

// Circuit artifacts paths
const CIRCUITS_DIR = path.join(__dirname, "..", "circuits");
const WASM_PATH = path.join(CIRCUITS_DIR, "temperatureRange_js", "temperatureRange.wasm");
const ZKEY_PATH = path.join(CIRCUITS_DIR, "temperatureRange_final.zkey");
const VKEY_PATH = path.join(CIRCUITS_DIR, "verification_key.json");

// Temperature range constants (scaled by 10)
const TEMP_MIN = 20;  // 2.0°C
const TEMP_MAX = 80;  // 8.0°C

/**
 * Check if ZK circuit artifacts exist
 */
function checkArtifacts() {
    const artifacts = [
        { path: WASM_PATH, name: "WASM circuit" },
        { path: ZKEY_PATH, name: "Proving key (zkey)" },
        { path: VKEY_PATH, name: "Verification key" }
    ];

    const missing = artifacts.filter(a => !fs.existsSync(a.path));

    if (missing.length > 0) {
        const missingNames = missing.map(a => a.name).join(", ");
        throw new Error(
            `ZK circuit artifacts not found: ${missingNames}. ` +
            `Run 'node circuits/compileCircuit.js' first.`
        );
    }

    return true;
}

/**
 * Generate a ZK proof that all temperature readings are within range
 * 
 * @param {number[]} temperatures - Array of 30 temperature readings in Celsius
 * @returns {Promise<{proof: Object, publicSignals: string[], proofHash: string}>}
 */
async function generateTempRangeProof(temperatures) {
    console.log("🔐 Generating ZK Temperature Range Proof...");

    // Validate input
    if (!Array.isArray(temperatures) || temperatures.length !== 30) {
        throw new Error(`Expected 30 temperature readings, got ${temperatures?.length || 0}`);
    }

    // Check artifacts exist
    checkArtifacts();

    // Scale temperatures by 10 to work with integers (5.5°C -> 55)
    const scaledValues = temperatures.map(t => {
        const scaled = Math.round(t * 10);
        // Pre-check: values must be in range for proof to succeed
        if (scaled < TEMP_MIN || scaled > TEMP_MAX) {
            throw new Error(
                `Temperature ${t}°C (scaled: ${scaled}) out of range ` +
                `[${TEMP_MIN / 10}°C - ${TEMP_MAX / 10}°C]. Proof cannot be generated.`
            );
        }
        return scaled;
    });

    // Prepare circuit input
    const input = {
        values: scaledValues,
        min: TEMP_MIN,
        max: TEMP_MAX
    };

    console.log("  → Circuit input prepared (30 readings, scaled to integers)");
    console.log(`  → Range: ${TEMP_MIN / 10}°C - ${TEMP_MAX / 10}°C`);

    // Generate proof using Groth16
    const startTime = Date.now();
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        WASM_PATH,
        ZKEY_PATH
    );
    const proofTime = Date.now() - startTime;

    console.log(`  ✓ Proof generated in ${proofTime}ms`);

    // Create a deterministic hash of the proof for on-chain anchoring
    const proofString = JSON.stringify(proof);
    const crypto = require("crypto");
    const proofHash = "0x" + crypto.createHash("sha256").update(proofString).digest("hex");

    console.log(`  ✓ Proof hash: ${proofHash.slice(0, 20)}...`);

    return {
        proof,
        publicSignals,
        proofHash,
        proofTime,
        inputHash: "0x" + crypto.createHash("sha256")
            .update(JSON.stringify(scaledValues))
            .digest("hex").slice(0, 40)
    };
}

/**
 * Verify a ZK proof
 * 
 * @param {Object} proof - The proof object from generateTempRangeProof
 * @param {string[]} publicSignals - The public signals from the proof
 * @returns {Promise<boolean>}
 */
async function verifyTempRangeProof(proof, publicSignals) {
    console.log("🔍 Verifying ZK Temperature Range Proof...");

    checkArtifacts();

    // Load verification key
    const vKeyJSON = fs.readFileSync(VKEY_PATH, "utf8");
    const vKey = JSON.parse(vKeyJSON);

    const startTime = Date.now();
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    const verifyTime = Date.now() - startTime;

    console.log(`  ${isValid ? "✓" : "✗"} Verification ${isValid ? "passed" : "failed"} in ${verifyTime}ms`);

    return isValid;
}

/**
 * Generate calldata for on-chain verification (for Solidity verifier contract)
 * 
 * @param {Object} proof - The proof object
 * @param {string[]} publicSignals - The public signals
 * @returns {Promise<string>}
 */
async function generateCalldata(proof, publicSignals) {
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    return calldata;
}

/**
 * Generate a complete proof package ready for API response
 * 
 * @param {number[]} temperatures - 30 temperature readings
 * @returns {Promise<Object>}
 */
async function generateProofPackage(temperatures) {
    const result = await generateTempRangeProof(temperatures);
    const isValid = await verifyTempRangeProof(result.proof, result.publicSignals);

    if (!isValid) {
        throw new Error("Generated proof failed self-verification");
    }

    // Generate Solidity calldata for on-chain verification
    const calldata = await generateCalldata(result.proof, result.publicSignals);

    return {
        success: true,
        proof: result.proof,
        publicSignals: result.publicSignals,
        proofHash: result.proofHash,
        inputHash: result.inputHash,
        proofTimeMs: result.proofTime,
        verified: isValid,
        calldata,
        metadata: {
            tempMin: TEMP_MIN / 10,
            tempMax: TEMP_MAX / 10,
            readingCount: temperatures.length,
            protocol: "groth16",
            curve: "bn128"
        }
    };
}

module.exports = {
    generateTempRangeProof,
    verifyTempRangeProof,
    generateCalldata,
    generateProofPackage,
    checkArtifacts,
    TEMP_MIN: TEMP_MIN / 10,
    TEMP_MAX: TEMP_MAX / 10
};
