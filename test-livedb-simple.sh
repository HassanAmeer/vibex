#!/bin/bash

# Simple LiveDB Test
# Quick test to verify LiveDB connection

echo "🔍 Testing LiveDB..."
echo ""

# Get users
echo "📋 Fetching users..."
curl -s -H "Authorization: Bearer 37160f2e00721d906831565829ae1de7" \
  "https://link.thelocalrent.com/api/db/vibex/users" | python3 -m json.tool

echo ""
echo ""

# Create test API key
echo "🔑 Creating test API key..."
TIMESTAMP=$(date +%s)
curl -s -X POST \
  -H "Authorization: Bearer 37160f2e00721d906831565829ae1de7" \
  -H "Content-Type: application/json" \
  -d "{\"provider\":\"test\",\"key\":\"key_$TIMESTAMP\",\"user_id\":\"user_$TIMESTAMP\",\"created_at\":\"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"}" \
  "https://link.thelocalrent.com/api/db/vibex/api_keys" | python3 -m json.tool

echo ""
echo ""

# Get API keys
echo "🔑 Fetching API keys..."
curl -s -H "Authorization: Bearer 37160f2e00721d906831565829ae1de7" \
  "https://link.thelocalrent.com/api/db/vibex/api_keys" | python3 -m json.tool

echo ""
echo "✅ Done!"
