#!/bin/bash
# Script to enable Redis keyspace notifications for booking expiry handling
# This allows the application to automatically release seats when bookings expire

echo "Enabling Redis keyspace notifications for expired keys..."

# Try to connect to Redis and enable notifications
if command -v redis-cli &> /dev/null; then
    redis-cli CONFIG SET notify-keyspace-events Ex
    if [ $? -eq 0 ]; then
        echo "✅ Successfully enabled Redis keyspace notifications"
        echo "   This setting will persist until Redis is restarted"
        echo ""
        echo "To make this permanent, add to redis.conf:"
        echo "   notify-keyspace-events Ex"
    else
        echo "❌ Failed to enable keyspace notifications"
        echo "   Make sure Redis is running and accessible"
        exit 1
    fi
else
    echo "⚠️  redis-cli not found"
    echo ""
    echo "Please enable keyspace notifications manually:"
    echo "   1. Connect to Redis: redis-cli"
    echo "   2. Run: CONFIG SET notify-keyspace-events Ex"
    echo ""
    echo "Or add to redis.conf:"
    echo "   notify-keyspace-events Ex"
    exit 1
fi

