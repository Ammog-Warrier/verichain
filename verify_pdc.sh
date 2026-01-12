#!/bin/bash

# Setup
export PATH="${PWD}/bin:$PATH"
export FABRIC_CFG_PATH="${PWD}/config/"
source scripts/utils.sh
. scripts/envVar.sh

# Deploy Contract (Updated with PDC)
infoln "Deploying updated contract with Private Data Collections..."
./deploy_contract.sh

# Wait for commitment
sleep 5

# Test Data
ASSET_ID_AGRI="private_asset_org1_$(date +%s)"
ASSET_ID_PHARMA="private_asset_org2_$(date +%s)"

ASSET_PROPERTIES_AGRI="{\"ID\": \"$ASSET_ID_AGRI\", \"cropType\": \"Wheat\", \"variety\": \"Lokwan\", \"harvestDate\": \"2024-04-01\", \"farmLocation\": \"Punjab\", \"farmerName\": \"AgriUser\", \"quantity\": 1000, \"status\": \"HARVESTED\"}"
ASSET_PROPERTIES_PHARMA="{\"ID\": \"$ASSET_ID_PHARMA\", \"drugName\": \"Paracetamol\", \"genericName\": \"Acetaminophen\", \"dosageForm\": \"Tablet\", \"strength\": \"500mg\", \"mfgDate\": \"2024-01-01\", \"expiryDate\": \"2026-01-01\", \"batchSize\": 10000, \"manufacturer\": \"PharmaUser\", \"status\": \"MANUFACTURED\"}"

ASSET_PROPERTIES_AGRI_BASE64=$(echo -n "$ASSET_PROPERTIES_AGRI" | base64 | tr -d \\n)
ASSET_PROPERTIES_PHARMA_BASE64=$(echo -n "$ASSET_PROPERTIES_PHARMA" | base64 | tr -d \\n)

# 1. Org1 Creates Asset in AgriCollection
infoln "Test 1: Org1 creating asset in AgriCollection..."
setGlobals 1
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C verichain-channel -n verichain-contract --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" -c '{"function":"CreatePrivateAsset","Args":[]}' --transient "{\"asset_properties\":\"$ASSET_PROPERTIES_AGRI_BASE64\"}"
if [ $? -eq 0 ]; then
  successln "Org1 created private asset successfully"
else
  fatalln "Org1 failed to create private asset"
fi

sleep 3

# 2. Verify Public Summary (Org1)
infoln "Test 2: Verifying Public Summary for Org1 asset..."
peer chaincode query -C verichain-channel -n verichain-contract -c "{\"function\":\"ReadAsset\",\"Args\":[\"$ASSET_ID_AGRI\"]}" >&log.txt
cat log.txt
if grep -q "AgriCollection" log.txt; then
  successln "Public summary correctly identifies AgriCollection"
else
  fatalln "Public summary missing or incorrect"
fi

# 3. Org1 Reads from AgriCollection (Should Succeed)
infoln "Test 3: Org1 reading from AgriCollection..."
peer chaincode query -C verichain-channel -n verichain-contract -c "{\"function\":\"ReadPrivateAsset\",\"Args\":[\"AgriCollection\", \"$ASSET_ID_AGRI\"]}" >&log.txt
if [ $? -eq 0 ]; then
  successln "Org1 read from AgriCollection successfully"
else
  fatalln "Org1 failed to read from AgriCollection"
fi

# 4. Org2 Reads from AgriCollection (Should Fail)
infoln "Test 4: Org2 reading from AgriCollection (Should Fail)..."
setGlobals 2
peer chaincode query -C verichain-channel -n verichain-contract -c "{\"function\":\"ReadPrivateAsset\",\"Args\":[\"AgriCollection\", \"$ASSET_ID_AGRI\"]}" >&log.txt
# Expecting failure
if [ $? -ne 0 ]; then
  successln "Org2 correctly failed to read from AgriCollection"
else
  grep "Error" log.txt
  if [ $? -eq 0 ]; then
     successln "Org2 correctly failed to read from AgriCollection (Error caught)"
  else
     cat log.txt
     fatalln "Org2 was able to read from AgriCollection! SECURITY FAILURE"
  fi
fi

# 5. Org2 Creates Asset in PharmaCollection
infoln "Test 5: Org2 creating asset in PharmaCollection..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C verichain-channel -n verichain-contract --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" -c '{"function":"CreatePrivateAsset","Args":[]}' --transient "{\"asset_properties\":\"$ASSET_PROPERTIES_PHARMA_BASE64\"}"
if [ $? -eq 0 ]; then
  successln "Org2 created private asset successfully"
else
  fatalln "Org2 failed to create private asset"
fi

# 6. Org1 Reads from PharmaCollection (Should Fail)
infoln "Test 6: Org1 reading from PharmaCollection (Should Fail)..."
setGlobals 1
peer chaincode query -C verichain-channel -n verichain-contract -c "{\"function\":\"ReadPrivateAsset\",\"Args\":[\"PharmaCollection\", \"$ASSET_ID_PHARMA\"]}" >&log.txt
if [ $? -ne 0 ]; then
  successln "Org1 correctly failed to read from PharmaCollection"
else
  grep "Error" log.txt
  if [ $? -eq 0 ]; then
     successln "Org1 correctly failed to read from PharmaCollection (Error caught)"
  else
     cat log.txt
     fatalln "Org1 was able to read from PharmaCollection! SECURITY FAILURE"
  fi
fi

successln "PDC Verification Completed Successfully"
