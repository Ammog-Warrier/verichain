#!/bin/bash

# Setup
API_URL="http://localhost:3000/api"
ORG="Org1"
USER_ID="apiUser_$(date +%s)"
ADMIN_ID="admin"
ASSET_ID="asset_$(date +%s)"
COLLECTION="AgriCollection"

echo "------------------------------------------------"
echo "Starting VeriChain API Verification"
echo "------------------------------------------------"

# 1. Register User (Public endpoint)
echo "Step 1: Registering User $USER_ID..."
RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"orgName\": \"$ORG\", \"userId\": \"$USER_ID\", \"adminId\": \"$ADMIN_ID\", \"role\": \"client\"}")

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"Successfully registered"* ]]; then
  echo "✅ Registration Successful"
else
  echo "❌ Registration Failed"
  exit 1
fi

echo "------------------------------------------------"

# 1.5 Login as OrgAdmin to get Token
echo "Step 1.5: Logging in as OrgAdmin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"orgName\": \"$ORG\", \"userId\": \"OrgAdmin\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [[ "$TOKEN" != "null" && -n "$TOKEN" ]]; then
  echo "✅ Login Successful. Token received."
else
  echo "❌ Login Failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "------------------------------------------------"

# 2. Create Asset (Protected)
echo "Step 2: Creating Asset $ASSET_ID in $COLLECTION..."
# Use OrgAdmin token
RESPONSE=$(curl -s -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assetId\": \"$ASSET_ID\",
    \"cropType\": \"Sweet Corn\",
    \"variety\": \"Golden Jubilee\",
    \"harvestDate\": \"2024-10-15\",
    \"farmLocation\": \"Nashik\",
    \"farmerName\": \"FarmerJohn\",
    \"quantity\": 5000,
    \"organicCertified\": true,
    \"status\": \"HARVESTED\"
  }")

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"created successfully"* ]]; then
  echo "✅ Asset Creation Successful"
else
  echo "❌ Asset Creation Failed"
fi

echo "------------------------------------------------"

# 3. Read Asset (Protected)
echo "Step 3: Reading Asset $ASSET_ID..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/assets/$ASSET_ID?collection=$COLLECTION")

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"FarmerJohn"* ]]; then
  echo "✅ Read Asset Successful"
else
  echo "❌ Read Asset Failed"
fi

echo "------------------------------------------------"
echo "Verification Complete"
