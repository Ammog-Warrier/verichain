#!/usr/bin/env node
/**
 * Circuit Compilation Script
 * Compiles the Circom circuit and generates proving/verification keys
 * 
 * Prerequisites:
 * - circom installed: npm install -g circom
 * - snarkjs installed: npm install snarkjs
 * 
 * Usage: node compileCircuit.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const CIRCUITS_DIR = __dirname;
const CIRCUIT_NAME = 'temperatureRange';
const PTAU_URL = 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau';
const PTAU_FILE = path.join(CIRCUITS_DIR, 'pot14_final.ptau');

// Helper to download file
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`  ✓ ${path.basename(dest)} already exists`);
            return resolve();
        }

        console.log(`  ↓ Downloading ${path.basename(dest)}...`);
        const file = fs.createWriteStream(dest);

        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                https.get(response.headers.location, (redirectedResponse) => {
                    redirectedResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

// Execute command with logging
function exec(cmd, label) {
    console.log(`  → ${label}...`);
    try {
        execSync(cmd, {
            cwd: CIRCUITS_DIR,
            stdio: 'pipe',
            maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large outputs
        });
        console.log(`  ✓ ${label} complete`);
    } catch (error) {
        console.error(`  ✗ ${label} failed:`);
        console.error(error.stderr?.toString() || error.message);
        throw error;
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     ZK Temperature Range Proof - Circuit Compiler        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const circuitPath = path.join(CIRCUITS_DIR, `${CIRCUIT_NAME}.circom`);

    if (!fs.existsSync(circuitPath)) {
        console.error(`Error: Circuit file not found at ${circuitPath}`);
        process.exit(1);
    }

    console.log('Step 1: Downloading Powers of Tau ceremony file...');
    await downloadFile(PTAU_URL, PTAU_FILE);

    console.log('\nStep 2: Compiling Circom circuit...');
    exec(
        `circom ${CIRCUIT_NAME}.circom --r1cs --wasm --sym -o .`,
        'Compile to R1CS and WASM'
    );

    console.log('\nStep 3: Generating proving key (zkey)...');
    exec(
        `npx snarkjs groth16 setup ${CIRCUIT_NAME}.r1cs ${PTAU_FILE} ${CIRCUIT_NAME}_0000.zkey`,
        'Initial zkey setup'
    );

    // Add entropy contribution (simulated)
    console.log('\nStep 4: Contributing to ceremony...');
    exec(
        `npx snarkjs zkey contribute ${CIRCUIT_NAME}_0000.zkey ${CIRCUIT_NAME}_final.zkey --name="VeriChain Contribution" -e="$(date +%s)${Math.random()}"`,
        'Add randomness contribution'
    );

    console.log('\nStep 5: Exporting verification key...');
    exec(
        `npx snarkjs zkey export verificationkey ${CIRCUIT_NAME}_final.zkey verification_key.json`,
        'Export verification key'
    );

    console.log('\nStep 6: Generating Solidity verifier...');
    exec(
        `npx snarkjs zkey export solidityverifier ${CIRCUIT_NAME}_final.zkey verifier.sol`,
        'Generate Solidity verifier contract'
    );

    // Cleanup intermediate files
    console.log('\nStep 7: Cleaning up...');
    const cleanupFiles = [
        `${CIRCUIT_NAME}_0000.zkey`,
        `${CIRCUIT_NAME}.sym`
    ];
    cleanupFiles.forEach(file => {
        const filePath = path.join(CIRCUITS_DIR, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`  ✓ Removed ${file}`);
        }
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                 Compilation Complete!                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\nGenerated artifacts:');
    console.log(`  📦 ${CIRCUIT_NAME}_js/       - WASM circuit`);
    console.log(`  🔑 ${CIRCUIT_NAME}_final.zkey - Proving key`);
    console.log(`  ✓  verification_key.json     - Verification key`);
    console.log(`  📄 verifier.sol              - Solidity verifier\n`);
}

main().catch(err => {
    console.error('\nCompilation failed:', err.message);
    process.exit(1);
});
