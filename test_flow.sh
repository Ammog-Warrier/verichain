#!/bin/bash
# test_flow.sh - Complete VeriChain Demo Flow Test
# Tests the entire pharmaceutical supply chain verification flow

set -e

BASE_URL="${API_URL:-http://localhost:3000}"
BATCH_ID="VAX-$(date +%s)"

echo "============================================"
echo "   VeriChain Demo Flow Test"
echo "   Testing complete supply chain verification"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${BLUE}→ $1${NC}"; }
section() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

# Check if API is running
info "Checking API availability..."
curl -s "$BASE_URL/" > /dev/null || error "API not running at $BASE_URL. Start with 'npm start' first."
success "API is running at $BASE_URL"

# ============= STEP 1: PHARMA MINTS ASSET =============
section "STEP 1: Pharma1 Mints a Vaccine Batch"

info "Logging in as Pharma1 (pharma1-cert)..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d '{"userId":"pharma1-cert","orgName":"Org1"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    error "Login failed for Pharma1"
fi
success "Logged in as Pharma1"

info "Minting asset $BATCH_ID..."
MINT_RESULT=$(curl -s -X POST "$BASE_URL/api/assets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"assetId\": \"$BATCH_ID\",
        \"drugName\": \"COVID-19 mRNA Vaccine\",
        \"cdscoLicenseNo\": \"CDSCO/MFG/2024/001234\",
        \"batchSize\": 10000,
        \"manufacturer\": \"Pharma1 Ltd.\",
        \"status\": \"MANUFACTURED\"
    }")

if echo "$MINT_RESULT" | jq -e '.message' > /dev/null 2>&1; then
    success "Asset minted: $BATCH_ID"
    echo "   Response: $(echo $MINT_RESULT | jq -c '.')"
else
    error "Minting failed: $MINT_RESULT"
fi

# ============= STEP 2: DISTRIBUTOR SIMULATES TRANSIT =============
section "STEP 2: Distributor Transports with IoT Temperature Monitoring"

info "Logging in as Distributor (distributor-cert)..."
DIST_TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d '{"userId":"distributor-cert","orgName":"Org3"}' | jq -r '.token')

if [ "$DIST_TOKEN" == "null" ] || [ -z "$DIST_TOKEN" ]; then
    error "Login failed for Distributor"
fi
success "Logged in as Distributor"

info "Simulating transit with 30 temperature readings..."
TRANSIT_RESULT=$(curl -s -X POST "$BASE_URL/api/transit/simulate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DIST_TOKEN" \
    -d "{\"batchId\": \"$BATCH_ID\"}")

if echo "$TRANSIT_RESULT" | jq -e '.stats' > /dev/null 2>&1; then
    MIN_TEMP=$(echo $TRANSIT_RESULT | jq -r '.stats.min')
    MAX_TEMP=$(echo $TRANSIT_RESULT | jq -r '.stats.max')
    IN_RANGE=$(echo $TRANSIT_RESULT | jq -r '.stats.inRange')
    READINGS=$(echo $TRANSIT_RESULT | jq -r '.readingCount')
    
    success "Transit simulated: $READINGS readings"
    echo "   Min: ${MIN_TEMP}°C, Max: ${MAX_TEMP}°C"
    echo "   Compliant: $IN_RANGE"
else
    error "Transit simulation failed: $TRANSIT_RESULT"
fi

# ============= STEP 3: GENERATE ZK-SNARK PROOF =============
section "STEP 3: Generating ZK-SNARK Proof (Groth16)"

info "Generating zero-knowledge proof for thermal compliance..."
PROOF_RESULT=$(curl -s -X POST "$BASE_URL/api/transit/generate-proof" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DIST_TOKEN" \
    -d "{\"batchId\": \"$BATCH_ID\"}")

if echo "$PROOF_RESULT" | jq -e '.proofHash' > /dev/null 2>&1; then
    PROOF_HASH=$(echo $PROOF_RESULT | jq -r '.proofHash')
    PROOF_TIME=$(echo $PROOF_RESULT | jq -r '.proofTimeMs')
    
    success "ZK Proof generated in ${PROOF_TIME}ms"
    echo "   Proof Hash: ${PROOF_HASH:0:40}..."
    echo "   Protocol: Groth16 on BN128 curve"
else
    error "Proof generation failed: $PROOF_RESULT"
fi

# ============= STEP 4: RETAILER VERIFIES =============
section "STEP 4: Retailer Verifies and Accepts Shipment"

info "Logging in as Retailer (retailer-cert)..."
RETAIL_TOKEN=$(curl -s -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d '{"userId":"retailer-cert","orgName":"Org4"}' | jq -r '.token')

if [ "$RETAIL_TOKEN" == "null" ] || [ -z "$RETAIL_TOKEN" ]; then
    error "Login failed for Retailer"
fi
success "Logged in as Retailer"

info "Verifying ZK proof for batch $BATCH_ID..."
VERIFY_RESULT=$(curl -s -X POST "$BASE_URL/api/transit/verify" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RETAIL_TOKEN" \
    -d "{\"batchId\": \"$BATCH_ID\"}")

if echo "$VERIFY_RESULT" | jq -e '.verified' > /dev/null 2>&1; then
    VERIFIED=$(echo $VERIFY_RESULT | jq -r '.verified')
    
    if [ "$VERIFIED" == "true" ]; then
        success "ZK Proof VERIFIED - Math-Verified: 100% Thermal Compliance"
        echo "   Status: Shipment can be accepted"
    else
        error "Verification failed"
    fi
else
    error "Verification request failed: $VERIFY_RESULT"
fi

# ============= STEP 5: PUBLIC VERIFICATION =============
section "STEP 5: Public Verification (Patient View)"

info "Patient verifying batch $BATCH_ID (no login required)..."
PUBLIC_RESULT=$(curl -s -X GET "$BASE_URL/api/transit/public/$BATCH_ID")

if echo "$PUBLIC_RESULT" | jq -e '.verified' > /dev/null 2>&1; then
    PUB_VERIFIED=$(echo $PUBLIC_RESULT | jq -r '.verified')
    STATUS=$(echo $PUBLIC_RESULT | jq -r '.status')
    RANGE=$(echo $PUBLIC_RESULT | jq -r '.complianceRange')
    
    if [ "$PUB_VERIFIED" == "true" ]; then
        success "PUBLIC VERIFICATION: CERTIFIED SAFE"
        echo "   Status: $STATUS"
        echo "   Compliance Range: $RANGE"
        echo "   Proof Hash: ${PROOF_HASH:0:20}..."
    else
        error "Public verification failed"
    fi
else
    error "Public verification request failed: $PUBLIC_RESULT"
fi

# ============= SUMMARY =============
echo ""
echo "============================================"
echo -e "   ${GREEN}ALL TESTS PASSED${NC}"
echo "============================================"
echo ""
echo "Demo Summary:"
echo "  Batch ID:     $BATCH_ID"
echo "  Drug:         COVID-19 mRNA Vaccine"
echo "  Temp Range:   ${MIN_TEMP}°C - ${MAX_TEMP}°C"
echo "  Proof Time:   ${PROOF_TIME}ms"
echo ""
echo "Flow Completed:"
echo "  1. ✓ Pharma1 minted asset"
echo "  2. ✓ Distributor simulated 30 temp readings"
echo "  3. ✓ ZK-SNARK proof generated"
echo "  4. ✓ Retailer verified and accepted"
echo "  5. ✓ Public verification succeeded"
echo ""
echo "Frontend URLs to test:"
echo "  → Business Portal: http://localhost:5173/portal"
echo "  → Retailer Terminal: http://localhost:5173/retailer"
echo "  → Public Verification: http://localhost:5173/public"
echo ""
