#!/bin/bash

# Quick API Key Save Test
# This script tests if API keys are being saved to LiveDB correctly

echo "🧪 Testing API Key Storage to LiveDB"
echo "===================================="
echo ""

BASE_URL="https://link.thelocalrent.com/api/db"
TOKEN="37160f2e00721d906831565829ae1de7"
PROJECT="vibex"
COLLECTION="api_keys"

# Test: Check if any API keys exist
echo "📋 Checking existing API keys in LiveDB..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$PROJECT/$COLLECTION")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Successfully connected to LiveDB"
    echo ""
    echo "API Keys in database:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Count keys
    KEY_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "?")
    echo ""
    echo "📊 Total API keys stored: $KEY_COUNT"
else
    echo "❌ Failed to connect to LiveDB"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY"
    exit 1
fi

echo ""
echo "💡 Next Steps:"
echo "1. Open the extension in VS Code"
echo "2. Go to Settings panel"
echo "3. Add an API key for any provider"
echo "4. Click Save"
echo "5. Run this script again to verify it was saved to LiveDB"
echo ""
