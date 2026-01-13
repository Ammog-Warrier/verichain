/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        // Ledger initialization is empty to avoid hardcoded/mock data.
        // Assets should be created dynamically via CreateAsset or CreatePrivateAsset.
        console.log('InitLedger: Ledger initialized without default assets.');
    }

    // CreateAsset issues a new asset to the world state with given details.
    // Updated to accept a generic JSON object to support flexible schemas
    async CreateAsset(ctx, id, data) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        let asset = {};
        try {
            asset = JSON.parse(data);
        } catch (err) {
            throw new Error('Data must be a valid JSON string');
        }

        asset.ID = id;

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // CreatePrivateAsset creates a new asset in a private data collection
    // Unified Pharma schema for competing pharmaceutical organizations
    async CreatePrivateAsset(ctx) {
        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0) {
            throw new Error('The private asset details must be supplied as transient data');
        }

        const assetJSON = transientData.get('asset_properties');
        if (!assetJSON) {
            throw new Error('The private asset details must be passed in the transient data map under the key "asset_properties"');
        }

        const assetInput = JSON.parse(assetJSON.toString());

        const mspID = ctx.clientIdentity.getMSPID();
        let collection = '';

        // Map MSP to collection (4-org supply chain)
        if (mspID === 'Org1MSP') {
            collection = 'Pharma1Collection';
        } else if (mspID === 'Org2MSP') {
            collection = 'Pharma2Collection';
        } else if (mspID === 'Org3MSP') {
            collection = 'DistributorCollection';
        } else if (mspID === 'Org4MSP') {
            collection = 'RetailerCollection';
        } else {
            throw new Error(`MSP ${mspID} is not authorized to create private assets`);
        }

        // Unified Pharmaceutical Asset Schema
        const asset = {
            ID: assetInput.ID,
            docType: 'pharma',
            // Ownership
            Owner: mspID.replace('MSP', ''), // e.g., 'Org1', 'Org2'
            // Drug Information
            drugName: assetInput.drugName || '',
            genericName: assetInput.genericName || '',
            dosageForm: assetInput.dosageForm || '',
            strength: assetInput.strength || '',
            // Manufacturing
            manufacturer: assetInput.manufacturer || '',
            facilityLocation: assetInput.facilityLocation || '',
            batchSize: Number(assetInput.batchSize) || 0,
            mfgDate: assetInput.mfgDate || '',
            expiryDate: assetInput.expiryDate || '',
            // Compliance
            cdscoLicenseNo: assetInput.cdscoLicenseNo || '',
            labTestResult: assetInput.labTestResult || '',
            productionCost: Number(assetInput.productionCost) || 0,
            // Status
            status: assetInput.status || 'MANUFACTURED'
        };

        // Write to private data collection
        await ctx.stub.putPrivateData(collection, asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));

        // Write public summary to world state (includes Owner for transfer tracking)
        const summary = {
            ID: asset.ID,
            docType: asset.docType,
            Owner: asset.Owner,
            Status: asset.status,
            Collection: collection,
            Submitter: mspID
        };
        await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(summary))));

        return JSON.stringify(summary);
    }

    // ReadPrivateAsset reads a private asset from a specific collection
    async ReadPrivateAsset(ctx, collection, id) {
        const assetJSON = await ctx.stub.getPrivateData(collection, id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist in collection ${collection}`);
        }
        return assetJSON.toString();
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, data) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        let updatedAsset = {};
        try {
            updatedAsset = JSON.parse(data);
        } catch (err) {
            throw new Error('Data must be a valid JSON string');
        }

        updatedAsset.ID = id;

        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // UpdateAssetStatus updates the status of an asset (e.g., MANUFACTURED -> IN_TRANSIT -> STOCKED)
    async UpdateAssetStatus(ctx, id, newStatus) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldStatus = asset.Status || asset.status;
        asset.Status = newStatus;
        asset.status = newStatus;
        const timestamp = ctx.stub.getTxTimestamp();
        const date = new Date(timestamp.seconds.low * 1000);
        asset.lastUpdated = date.toISOString();
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        console.log(`Asset ${id} status updated: ${oldStatus} -> ${newStatus}`);
        return JSON.stringify({ id, oldStatus, newStatus });
    }

    // AnchorProofHash stores a ZK proof hash on an asset for verification
    async AnchorProofHash(ctx, id, proofHash, proofType) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.proofHash = proofHash;
        asset.proofType = proofType || 'thermal_compliance';
        const timestamp = ctx.stub.getTxTimestamp();
        const date = new Date(timestamp.seconds.low * 1000);
        asset.proofAnchoredAt = date.toISOString();
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        console.log(`Proof anchored on asset ${id}: ${proofHash.slice(0, 20)}...`);
        return JSON.stringify({ id, proofHash, proofType: asset.proofType });
    }

    // GetAssetsByStatus returns all assets with a specific status
    async GetAssetsByStatus(ctx, status) {
        const queryString = {
            selector: {
                Status: status
            }
        };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = [];
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            try {
                results.push(JSON.parse(strValue));
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        return JSON.stringify(results);
    }

    // GetAssetHistory returns the full transaction history for an asset
    async GetAssetHistory(ctx, id) {
        const iterator = await ctx.stub.getHistoryForKey(id);
        const history = [];

        let result = await iterator.next();
        while (!result.done) {
            const record = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete
            };

            if (!result.value.isDelete) {
                try {
                    record.value = JSON.parse(result.value.value.toString('utf8'));
                } catch (err) {
                    record.value = result.value.value.toString('utf8');
                }
            }

            history.push(record);
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(history);
    }
}

module.exports = AssetTransfer;

