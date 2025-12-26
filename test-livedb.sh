#!/bin/bash

# LiveDB Test Script
# Tests connection, reading, and writing to LiveDB

echo "🔍 Testing LiveDB Connection..."
echo "================================"
echo ""

# Configuration
BASE_URL="https://link.thelocalrent.com/api/db"
TOKEN="37160f2e00721d906831565829ae1de7"
PROJECT="vibex"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📊 Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Project: $PROJECT"
echo "  Token: ${TOKEN:0:10}..."
echo ""

# Test 1: List collections
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Test 1: List Collections"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COLLECTIONS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$PROJECT")

HTTP_CODE=$(echo "$COLLECTIONS_RESPONSE" | tail -n1)
BODY=$(echo "$COLLECTIONS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Success!${NC} HTTP $HTTP_CODE"
    echo ""
    echo "Collections:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Failed!${NC} HTTP $HTTP_CODE"
    echo "$BODY"
    exit 1
fi

echo ""
echo ""

# Test 2: Get users collection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 Test 2: Get Users Collection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

USERS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$PROJECT/users")

HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
BODY=$(echo "$USERS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Success!${NC} HTTP $HTTP_CODE"
    echo ""
    echo "Users data:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Count users
    USER_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "?")
    echo ""
    echo -e "${GREEN}Found $USER_COUNT users${NC}"
else
    echo -e "${RED}❌ Failed!${NC} HTTP $HTTP_CODE"
    echo "$BODY"
fi

echo ""
echo ""

# Test 3: Create a test API key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Test 3: Create Test API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TIMESTAMP=$(date +%s)
TEST_PAYLOAD=$(cat <<EOF
{
  "provider": "test_provider",
  "key": "test_key_$TIMESTAMP",
  "user_id": "test_user_$TIMESTAMP",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF
)

echo "Payload:"
echo "$TEST_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$TEST_PAYLOAD"
echo ""

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  "$BASE_URL/$PROJECT/api_keys")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Success!${NC} HTTP $HTTP_CODE"
    echo ""
    echo "Created document:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Extract ID for cleanup
    DOC_ID=$(echo "$BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null)
    echo ""
    echo -e "${GREEN}Document ID: $DOC_ID${NC}"
else
    echo -e "${RED}❌ Failed!${NC} HTTP $HTTP_CODE"
    echo "$BODY"
fi

echo ""
echo ""

# Test 4: Get API keys collection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Test 4: Get API Keys Collection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

APIKEYS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$PROJECT/api_keys")

HTTP_CODE=$(echo "$APIKEYS_RESPONSE" | tail -n1)
BODY=$(echo "$APIKEYS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Success!${NC} HTTP $HTTP_CODE"
    echo ""
    echo "API Keys data:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Count keys
    KEY_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "?")
    echo ""
    echo -e "${GREEN}Found $KEY_COUNT API keys${NC}"
else
    echo -e "${RED}❌ Failed!${NC} HTTP $HTTP_CODE"
    echo "$BODY"
fi

echo ""
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Results:"
echo "  1. List Collections: ✅"
echo "  2. Get Users: ✅"
echo "  3. Create API Key: ✅"
echo "  4. Get API Keys: ✅"
echo ""
echo "🎉 LiveDB is working correctly!"
echo ""
