/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { connectToNetwork } = require('./src/fabricGateway');
const { execSync } = require('child_process');

async function main() {
    try {
        console.log('--- VeriChain Test Flow ---');

        // 1. Enroll Admin
        console.log('\nStep 1: Enrolling Admin...');
        execSync('node src/enrollAdmin.js', { stdio: 'inherit' });

        // 2. Register User
        console.log('\nStep 2: Registering User "appUser"...');
        execSync('node src/registerUser.js', { stdio: 'inherit' });

        // 3. Connect as appUser
        console.log('\nStep 3: Connecting to Gateway as "appUser"...');
        // Note: connectToNetwork boilerplate might typically take (org, user)
        // We will assume it connects using the wallet.
        const connection = await connectToNetwork('org1', 'appUser');

        if (!connection) {
            throw new Error('Failed to connect to gateway');
        }

        const { contract, gateway } = connection;
        console.log('Connected to Gateway.');

        // 4. Invoke Transaction
        console.log('\nStep 4: Invoking InitLedger...');
        // Using "InitLedger" as a standard robust test if using asset-transfer-basic
        await contract.submitTransaction('InitLedger');
        console.log('✅ InitLedger Transaction Submitted Successfully');

        // 5. Query
        console.log('\nStep 5: Querying All Assets...');
        const result = await contract.evaluateTransaction('GetAllAssets');
        console.log(`Query Result: ${result.toString()}`);

        gateway.disconnect();
        console.log('\n✅ Test Flow Complete!');

    } catch (error) {
        console.error(`\n❌ Test Flow Failed: ${error}`);
        process.exit(1);
    }
}

main();
