# Rate Limiting Tests

Test scripts to verify rate limiting functionality.

## Test Files

### `test-rate-limit.js`

**Purpose:** Tests single IP rate limiting

- Makes 15 requests from the same IP
- Verifies that first 10 requests succeed
- Verifies that requests 11-15 are blocked (429 status)

**Usage:**

```bash
npm run test:rate-limit
```

**Expected Result:**

- First 10 requests: ✅ Success (202)
- Requests 11-15: 🚫 Rate Limited (429)

---

### `test-rate-limit-multi-ip.js`

**Purpose:** Tests that each IP has its own separate limit

- Makes requests from two different IPs
- Verifies that each IP has independent rate limits

**Usage:**

```bash
npm run test:rate-limit:multi
```

**Expected Result:**

- Each IP can make requests independently
- IP1's usage doesn't affect IP2's limit

---

## Why Keep These Tests?

✅ **For Presentation:**

- Demonstrates rate limiting works
- Shows protection against abuse
- Easy to run live during demo

✅ **For Development:**

- Quick verification after changes
- Debug rate limiting issues
- Test different scenarios

✅ **For Documentation:**

- Shows how rate limiting behaves
- Examples for other developers

---

## Requirements

- Server must be running (`npm run dev` or `npm run start:pm2`)
- Redis must be running (Docker container)
- Kafka must be running (if using Kafka mode)
