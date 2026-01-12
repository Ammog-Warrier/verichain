#!/bin/bash
#
# Script to complete the pending chaincode deployment
# This approves sequence 1 for org3 and org4, then commits it
#

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export PATH=${ROOTDIR}/../bin:${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

source scripts/utils.sh
. scripts/envVar.sh
. scripts/ccutils.sh

CHANNEL_NAME="verichain-channel"
CC_NAME="verichain-contract"
CC_VERSION="1.0"
CC_SEQUENCE="1"
PACKAGE_ID="verichain-contract_1.0:dd6fd3b74633013d7fbaf9b962867663f642f8662d0dd59bfff28a3b1058c618"
CC_END_POLICY="--signature-policy AND('Org1MSP.peer','Org2MSP.peer')"

infoln "Approving chaincode definition for org3..."
approveForMyOrg 3

infoln "Approving chaincode definition for org4..."
approveForMyOrg 4

infoln "Checking commit readiness..."
setGlobals 1
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} ${CC_END_POLICY} --output json

infoln "Committing chaincode definition with all 4 orgs..."
commitChaincodeDefinition 1 2 3 4

infoln "Querying committed chaincode..."
queryCommitted 1
queryCommitted 2
queryCommitted 3
queryCommitted 4

successln "Chaincode deployment completed successfully!"
