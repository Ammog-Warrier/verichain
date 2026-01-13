#!/bin/bash
# query_ledger.sh - Query world state and ledger history for a batch ID
#
# Usage: ./query_ledger.sh <BATCH_ID>
# Example: ./query_ledger.sh VAX-123456

set -e

if [ -z "$1" ]; then
    echo "Usage: ./query_ledger.sh <BATCH_ID>"
    exit 1
fi

BATCH_ID="$1"
CHANNEL="verichain-channel"
CC_NAME="basic"

echo "================================================"
echo "  VeriChain Ledger Query Tool"
echo "  Batch ID: $BATCH_ID"
echo "================================================"
echo ""

# Set environment to Org1 (can query from any org)
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "=== 1. WORLD STATE (Current Asset State) ==="
echo ""
peer chaincode query -C $CHANNEL -n $CC_NAME -c "{\"function\":\"ReadAsset\",\"Args\":[\"$BATCH_ID\"]}" 2>/dev/null | jq . || echo "Asset not found in world state"

echo ""
echo "=== 2. ASSET HISTORY (All Ledger Transactions) ==="
echo ""

# Query asset history using GetHistoryForKey
peer chaincode query -C $CHANNEL -n $CC_NAME -c "{\"function\":\"GetAssetHistory\",\"Args\":[\"$BATCH_ID\"]}" 2>/dev/null | jq . || echo "No history found (function may not exist)"

echo ""
echo "=== 3. PRIVATE DATA (if accessible) ==="
echo ""

# Try each collection
for COLLECTION in "Pharma1Collection" "Pharma2Collection" "DistributorCollection" "RetailerCollection"; do
    echo "Checking $COLLECTION..."
    RESULT=$(peer chaincode query -C $CHANNEL -n $CC_NAME -c "{\"function\":\"ReadPrivateAsset\",\"Args\":[\"$COLLECTION\",\"$BATCH_ID\"]}" 2>/dev/null) || RESULT=""
    if [ -n "$RESULT" ]; then
        echo "$RESULT" | jq .
    else
        echo "  Not accessible or not found"
    fi
    echo ""
done

echo "=== 4. ZK PROOF STATUS (from PostgreSQL) ==="
echo ""
PGPASSWORD=verichain_secret psql -h localhost -p 5433 -U verichain -d verichain -c "SELECT batch_id, proof_hash, min_temp, max_temp, in_range, verified, generated_at FROM transit_proofs WHERE batch_id = '$BATCH_ID';" 2>/dev/null || echo "PostgreSQL not available or no proof found"

echo ""
echo "================================================"
echo "  Query Complete"
echo "================================================"
