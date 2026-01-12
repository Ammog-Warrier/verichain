#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to setup VeriChain 4-Org Consortium Network

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export PATH=${ROOTDIR}/bin:${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/configtx
export VERBOSE=true

. scripts/utils.sh

# Cleanup
infoln "Cleaning up previous network artifacts..."
docker-compose -f compose/compose-test-net.yaml down --volumes --remove-orphans
./network.sh down

# Generate Crypto
infoln "Generating crypto material for all 4 Orgs..."
if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
fi

which cryptogen
if [ "$?" -ne 0 ]; then
    fatalln "cryptogen tool not found. exiting"
fi

cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-org1.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-org2.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-org3.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-org4.yaml --output="organizations"

# Generate CCP files
./organizations/ccp-generate.sh

# Start Network
infoln "Starting Network..."
DOCKER_SOCK="/var/run/docker.sock"
docker-compose -f compose/compose-test-net.yaml up -d 2>&1

# Wait for containers
sleep 5

# Create Channel
infoln "Creating Channel 'verichain-channel'..."
# Using the updated createChannel.sh which now handles 4 orgs
./scripts/createChannel.sh verichain-channel 3 5 true 0

# API Setup
infoln "Installing API dependencies..."
pushd verichain-api
npm install
popd

infoln "VeriChain Network Setup Complete!"
infoln "API is ready in ./verichain-api"
