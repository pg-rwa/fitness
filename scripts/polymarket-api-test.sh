#!/bin/bash
# Polymarket API Access Test Script
# Run this on your DigitalOcean droplet to check if APIs are accessible

echo "============================================"
echo "  Polymarket API Access Test"
echo "  $(date)"
echo "============================================"
echo ""

# 1. Check our public IP
echo "--- 1. Server IP ---"
IP=$(curl -s --max-time 10 https://api.ipify.org 2>/dev/null || echo "FAILED")
echo "Public IP: $IP"
echo ""

# 2. Geoblock check
echo "--- 2. Geoblock Status ---"
GEOBLOCK=$(curl -s --max-time 10 "https://polymarket.com/api/geoblock" 2>/dev/null)
if [ -z "$GEOBLOCK" ]; then
    echo "Result: FAILED to reach endpoint"
else
    echo "Result: $GEOBLOCK"
fi
echo ""

# 3. Gamma API (read-only market data, no auth)
echo "--- 3. Gamma API (Market Data - No Auth) ---"
GAMMA_STATUS=$(curl -s -o /tmp/gamma_response.json -w "%{http_code}" --max-time 10 "https://gamma-api.polymarket.com/markets?limit=2" 2>/dev/null)
echo "HTTP Status: $GAMMA_STATUS"
if [ "$GAMMA_STATUS" = "200" ]; then
    echo "✓ Gamma API is ACCESSIBLE"
    echo "Sample response (first 300 chars):"
    head -c 300 /tmp/gamma_response.json
    echo ""
else
    echo "✗ Gamma API is BLOCKED or unreachable"
    cat /tmp/gamma_response.json 2>/dev/null
fi
echo ""

# 4. CLOB API - server time (public, no auth)
echo "--- 4. CLOB API - Server Time (No Auth) ---"
CLOB_TIME_STATUS=$(curl -s -o /tmp/clob_time.json -w "%{http_code}" --max-time 10 "https://clob.polymarket.com/time" 2>/dev/null)
echo "HTTP Status: $CLOB_TIME_STATUS"
if [ "$CLOB_TIME_STATUS" = "200" ]; then
    echo "✓ CLOB API time endpoint is ACCESSIBLE"
    echo "Response: $(cat /tmp/clob_time.json)"
else
    echo "✗ CLOB API is BLOCKED or unreachable"
    cat /tmp/clob_time.json 2>/dev/null
fi
echo ""

# 5. CLOB API - orderbook (public, no auth)
echo "--- 5. CLOB API - Sample Orderbook (No Auth) ---"
# First get a market token from gamma
if [ "$GAMMA_STATUS" = "200" ]; then
    # Try to extract a token ID from gamma response
    TOKEN=$(python3 -c "
import json
with open('/tmp/gamma_response.json') as f:
    data = json.load(f)
if isinstance(data, list) and len(data) > 0:
    tokens = data[0].get('tokens', [])
    if tokens:
        print(tokens[0].get('token_id', ''))
" 2>/dev/null)

    if [ -n "$TOKEN" ]; then
        BOOK_STATUS=$(curl -s -o /tmp/clob_book.json -w "%{http_code}" --max-time 10 "https://clob.polymarket.com/book?token_id=$TOKEN" 2>/dev/null)
        echo "HTTP Status: $BOOK_STATUS"
        if [ "$BOOK_STATUS" = "200" ]; then
            echo "✓ CLOB orderbook is ACCESSIBLE"
            echo "Response (first 300 chars):"
            head -c 300 /tmp/clob_book.json
            echo ""
        else
            echo "✗ CLOB orderbook is BLOCKED"
            cat /tmp/clob_book.json 2>/dev/null
        fi
    else
        echo "Skipped - couldn't extract token from Gamma response"
    fi
else
    echo "Skipped - Gamma API not accessible"
fi
echo ""

# 6. Polymarket website (for comparison)
echo "--- 6. Polymarket Website ---"
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://polymarket.com" 2>/dev/null)
echo "HTTP Status: $SITE_STATUS"
if [ "$SITE_STATUS" = "200" ] || [ "$SITE_STATUS" = "301" ] || [ "$SITE_STATUS" = "302" ]; then
    echo "✓ Website is ACCESSIBLE"
else
    echo "✗ Website returned status $SITE_STATUS"
fi
echo ""

# Summary
echo "============================================"
echo "  SUMMARY"
echo "============================================"
echo "Server IP:     $IP"
echo "Geoblock:      $GEOBLOCK"
echo "Gamma API:     HTTP $GAMMA_STATUS"
echo "CLOB API:      HTTP $CLOB_TIME_STATUS"
echo "Website:       HTTP $SITE_STATUS"
echo ""
echo "If Gamma & CLOB return 200, a trading bot is"
echo "technically feasible from this server."
echo "============================================"

# Cleanup
rm -f /tmp/gamma_response.json /tmp/clob_time.json /tmp/clob_book.json
