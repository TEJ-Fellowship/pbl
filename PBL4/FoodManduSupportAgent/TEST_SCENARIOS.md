# 🧪 FoodMandu Order Tracking - Test Scenarios

## Quick Test Guide

This document provides specific test scenarios to verify all features are working correctly.

---

## 🚀 Before Testing

### **1. Start Backend:**

```bash
cd backend
npm start
```

✅ Backend should be running on `http://localhost:5000`

### **2. Start Frontend:**

```bash
cd frontend
npm run dev
```

✅ Frontend should be running on `http://localhost:5173`

### **3. Verify Backend Health:**

Open browser: `http://localhost:5000/api/health`

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "database": "connected"
}
```

---

## 📋 Test Scenarios

### **Test 1: Order List Loading** ✅

**Purpose:** Verify frontend loads all available orders

**Steps:**

1. Open `http://localhost:5173`
2. Look at the sidebar "Quick Tracking" section
3. Click the dropdown "Select an order..."

**Expected Result:**

- Dropdown shows 20 orders
- Each order displays: Order Number - Restaurant Name (status)
- Example: "ORD-2025-000001 - Bajeko Sekuwa (order_ready)"

**Status:** PASS ✅ / FAIL ❌

---

### **Test 2: Order Placed Status** 📦

**Purpose:** Test tracking for newly placed orders

**Order ID:** `FM100004`
**Status:** `order_placed`

**Steps:**

1. Select "ORD-2025-000004 - Roadhouse Café (order_placed)" from dropdown
2. Click "Track" button

**Expected Result:**

- ✅ Flashcard appears
- ✅ Order number: ORD-2025-000004
- ✅ Restaurant: Roadhouse Café
- ✅ Order items: Chicken Momo (1x Rs. 220), Coke (1x Rs. 80)
- ✅ Total: Rs. 380
- ✅ Stage 1 highlighted (Order Placed)
- ✅ Timestamp shown for stage 1
- ✅ No map (animated placeholder instead)
- ✅ ETA displayed

**Status:** PASS ✅ / FAIL ❌

---

### **Test 3: Order Being Prepared** 👨‍🍳

**Purpose:** Test tracking during food preparation

**Order ID:** `FM100009`
**Status:** `order_preparing`

**Steps:**

1. Select "ORD-2025-000009 - Himalayan Flavours (order_preparing)"
2. Click "Track" button

**Expected Result:**

- ✅ Flashcard appears
- ✅ Stage 2 highlighted (Order being Prepared)
- ✅ Yellow pulse animation on current stage
- ✅ Stages 1 completed (green checkmark)
- ✅ Animated "Preparing Your Order" placeholder
- ✅ 3 animated dots bouncing
- ✅ No live map yet
- ✅ ETA updates

**Status:** PASS ✅ / FAIL ❌

---

### **Test 4: Order Ready for Delivery** ✅

**Purpose:** Test tracking when order is ready for pickup

**Order ID:** `FM100001`
**Status:** `order_ready`

**Steps:**

1. Select "ORD-2025-000001 - Bajeko Sekuwa (order_ready)"
2. Click "Track" button

**Expected Result:**

- ✅ Stage 3 highlighted (Order Ready for Delivery)
- ✅ Stages 1-2 completed (green checkmarks)
- ✅ Timestamps shown for completed stages
- ✅ Still showing preparation placeholder
- ✅ Driver info not yet visible

**Status:** PASS ✅ / FAIL ❌

---

### **Test 5: Live Delivery Tracking (Most Important!)** 🚴🗺️

**Purpose:** Test full live tracking with map

**Order ID:** `FM100002`
**Status:** `on_the_way`
**Restaurant:** Himalayan Flavours

**Steps:**

1. Select "ORD-2025-000002 - Himalayan Flavours (on_the_way)"
2. Click "Track" button
3. Allow location permission when prompted (optional)
4. Wait 5-10 seconds for updates

**Expected Result:**

- ✅ **Live map appears!**
- ✅ Stage 4 highlighted (Order is on the Way)
- ✅ Stages 1-3 completed (green checkmarks)
- ✅ 🔴 "LIVE" indicator badge on map
- ✅ Three markers visible:
  - 🏪 Restaurant marker (Himalayan Flavours)
  - 🚴 Delivery person marker (yellow, moving)
  - 📍 Destination marker (red pin)
- ✅ **Blue route line** connecting all points
- ✅ Route follows roads (not straight line)
- ✅ Driver information section visible:
  - Name: Ravi Tamang
  - Phone: +977-9819876543
  - Vehicle: motorcycle
  - Vehicle Number: BA-3-PA-6789
- ✅ Delivery person marker moves slightly every 5 seconds
- ✅ ETA updates in real-time
- ✅ Location permission banner (if granted/denied)

**Status:** PASS ✅ / FAIL ❌

---

### **Test 6: Delivered Order** ✔️

**Purpose:** Test completed order display

**Order ID:** `FM100003`
**Status:** `delivered`

**Steps:**

1. Select "ORD-2025-000003 - Bajeko Sekuwa (delivered)"
2. Click "Track" button

**Expected Result:**

- ✅ All 5 stages completed (all green checkmarks)
- ✅ Stage 5 highlighted (Order Delivered)
- ✅ Map shown (delivery person at destination)
- ✅ Driver info visible
- ✅ ETA = 0 or "Delivered"
- ✅ Timestamps for all stages

**Status:** PASS ✅ / FAIL ❌

---

### **Test 7: Location Permission - Granted** 📍

**Purpose:** Test user location integration

**Order ID:** Any "on_the_way" order (e.g., FM100002)

**Steps:**

1. Clear browser location permission for localhost
2. Reload page
3. Track an "on_the_way" order
4. Click "Allow" when browser asks for location

**Expected Result:**

- ✅ Blue "Requesting your location..." banner appears
- ✅ After allowing, green banner shows "Tracking to your location: [coords]"
- ✅ Destination marker moves to your actual location
- ✅ Route recalculates to your real GPS position
- ✅ Backend receives `userLat` and `userLng` parameters

**Status:** PASS ✅ / FAIL ❌

---

### **Test 8: Location Permission - Denied** 🚫

**Purpose:** Test fallback when location is denied

**Order ID:** Any "on_the_way" order

**Steps:**

1. Track an order
2. Click "Block" when browser asks for location (or deny in browser settings)

**Expected Result:**

- ✅ Orange banner appears: "Location Access Denied"
- ✅ Description: "Using default location..."
- ✅ "Try Again" button visible
- ✅ Map still works, using order's delivery address
- ✅ Tracking continues normally

**Status:** PASS ✅ / FAIL ❌

---

### **Test 9: Chat-Based Tracking** 💬

**Purpose:** Test natural language order tracking

**Steps:**

1. In chat input, type: `track my order FM100002`
2. Press Enter or click Send

**Expected Result:**

- ✅ User message appears: "track my order FM100002"
- ✅ Bot detects tracking intent
- ✅ Tracking flashcard appears automatically
- ✅ Order FM100002 is tracked

**Alternative phrases to test:**

- `track order ORD-2025-000002`
- `where is my order FM100005`
- `delivery status for FM100012`

**Status:** PASS ✅ / FAIL ❌

---

### **Test 10: Language Switching** 🌍

**Purpose:** Test internationalization

**Steps:**

1. Track any order
2. Click "नेपाली" button in sidebar
3. Observe UI changes

**Expected Result:**

- ✅ All text switches to Nepali
- ✅ Tracking flashcard labels in Nepali
- ✅ Dropdown shows "अर्डर छान्नुहोस्..."
- ✅ "ट्र्याक गर्नुहोस्" button
- ✅ Timeline stages in Nepali
- ✅ Driver info labels in Nepali
- ✅ Click "English" to switch back

**Status:** PASS ✅ / FAIL ❌

---

### **Test 11: Real-Time Updates** 🔄

**Purpose:** Test polling and live updates

**Order ID:** `FM100002` (on_the_way)

**Steps:**

1. Track order FM100002
2. Open browser DevTools → Network tab
3. Filter by "track"
4. Watch network requests

**Expected Result:**

- ✅ Initial request: `GET /api/track?orderId=FM100002&...`
- ✅ Requests repeat every 5 seconds
- ✅ Each request includes `userLat` and `userLng` (if permission granted)
- ✅ Delivery marker position changes slightly with each update
- ✅ ETA may change
- ✅ Console logs show "✅ Found order..." messages

**Status:** PASS ✅ / FAIL ❌

---

### **Test 12: Order Items Display** 📦

**Purpose:** Test order details rendering

**Order ID:** Any order

**Steps:**

1. Track any order with items
2. Look at the "Order Items" section

**Expected Result:**

- ✅ Section header: "📦 Order Items (2)" (or actual count)
- ✅ Each item shows:
  - Quantity: "1x Chicken Momo"
  - Price: "Rs. 220"
- ✅ If more than 3 items, shows "+X more item(s)"
- ✅ Total at bottom: "Rs. 380" (in yellow)
- ✅ Divider line above total

**Status:** PASS ✅ / FAIL ❌

---

### **Test 13: Map Interactions** 🗺️

**Purpose:** Test map functionality

**Order ID:** `FM100005` (on_the_way)

**Steps:**

1. Track order with live map
2. Click on markers
3. Try to pan/zoom the map

**Expected Result:**

- ✅ Clicking restaurant marker shows popup:
  - "🏪 [Restaurant Name]"
  - Area/location
- ✅ Clicking delivery marker shows:
  - "🚴 [Driver Name]"
  - Vehicle type
  - "● Live Location"
- ✅ Clicking destination shows:
  - "📍 Your Location"
  - "Delivery Destination"
- ✅ Map is pannable (drag to move)
- ✅ Zoom controls work (+/- buttons)
- ✅ Scroll wheel zoom disabled by default

**Status:** PASS ✅ / FAIL ❌

---

### **Test 14: Close Tracking Flashcard** ❌

**Purpose:** Test closing the tracking UI

**Steps:**

1. Track any order
2. Click the X button (top-right corner)

**Expected Result:**

- ✅ Flashcard disappears
- ✅ Chat interface remains visible
- ✅ Can track another order
- ✅ Polling stops (check Network tab)

**Status:** PASS ✅ / FAIL ❌

---

### **Test 15: Error Handling - Invalid Order** 🚫

**Purpose:** Test error handling for non-existent orders

**Steps:**

1. Type in chat: `track order INVALID123`
2. Or manually try: `http://localhost:5000/api/track?orderId=INVALID123`

**Expected Result:**

- ✅ Error message: "Order not found. Please check your Order ID."
- ✅ HTTP 404 status
- ✅ Frontend shows error flashcard with red border
- ✅ X icon and error message visible

**Status:** PASS ✅ / FAIL ❌

---

### **Test 16: Multiple Orders Simultaneously** 🔄

**Purpose:** Test switching between orders

**Steps:**

1. Track order FM100002
2. Without closing, select order FM100008 from dropdown
3. Click "Track" again

**Expected Result:**

- ✅ Previous tracking stops
- ✅ New order displays
- ✅ Map changes if status is different
- ✅ Order details update
- ✅ No duplicate flashcards

**Status:** PASS ✅ / FAIL ❌

---

### **Test 17: Backend API Directly** 🔧

**Purpose:** Test backend endpoints independently

**Steps:**

1. Open browser or Postman
2. Test endpoints:

```bash
# Get all orders
GET http://localhost:5000/api/orders

# Get specific order
GET http://localhost:5000/api/orders/FM100002

# Track order
GET http://localhost:5000/api/track?orderId=FM100002&userLat=27.7&userLng=85.3
```

**Expected Result:**

- ✅ `/api/orders` returns all 20 orders
- ✅ `/api/orders/FM100002` returns single order object
- ✅ `/api/track` returns tracking data with `roadRoute` array
- ✅ All responses have `success: true`
- ✅ Timestamps in ISO format

**Status:** PASS ✅ / FAIL ❌

---

### **Test 18: Road Routing vs Straight Line** 🛣️

**Purpose:** Verify OSRM routing integration

**Order ID:** `FM100002`

**Steps:**

1. Track order FM100002
2. Observe the route line on map
3. Check browser console for route logs

**Expected Result:**

- ✅ Console log: "🗺️ Road route calculated: [N] points"
- ✅ Blue route follows actual roads
- ✅ Route is NOT a straight line
- ✅ Route has many coordinate points (50+)
- ✅ If OSRM fails, fallback to straight line is used

**Status:** PASS ✅ / FAIL ❌

---

### **Test 19: Responsive Design** 📱

**Purpose:** Test UI on different screen sizes

**Steps:**

1. Track any order
2. Open DevTools → Toggle device toolbar
3. Test mobile, tablet, desktop views

**Expected Result:**

- ✅ Sidebar collapsible on mobile
- ✅ Tracking flashcard responsive
- ✅ Map resizes properly
- ✅ Order items list readable on mobile
- ✅ Buttons accessible
- ✅ No horizontal scrolling

**Status:** PASS ✅ / FAIL ❌

---

### **Test 20: All Order Statuses** 🎯

**Purpose:** Quick test of all 5 status types

**Steps:**
Test one order from each status:

1. **order_placed**: FM100004
2. **order_preparing**: FM100009
3. **order_ready**: FM100001
4. **on_the_way**: FM100002
5. **delivered**: FM100003

**Expected Result:**

- ✅ Each shows appropriate stage highlighted
- ✅ Map appears only for stages 4-5
- ✅ Driver info visible only for stages 4-5
- ✅ Timeline progression correct for each
- ✅ ETA decreases as stages progress

**Status:** PASS ✅ / FAIL ❌

---

## 📊 Test Results Summary

| Test # | Test Name          | Status | Notes              |
| ------ | ------------------ | ------ | ------------------ |
| 1      | Order List Loading | ⬜     |                    |
| 2      | Order Placed       | ⬜     |                    |
| 3      | Order Preparing    | ⬜     |                    |
| 4      | Order Ready        | ⬜     |                    |
| 5      | Live Tracking      | ⬜     | **Most Important** |
| 6      | Delivered Order    | ⬜     |                    |
| 7      | Location Granted   | ⬜     |                    |
| 8      | Location Denied    | ⬜     |                    |
| 9      | Chat Tracking      | ⬜     |                    |
| 10     | Language Switch    | ⬜     |                    |
| 11     | Real-Time Updates  | ⬜     |                    |
| 12     | Order Items        | ⬜     |                    |
| 13     | Map Interactions   | ⬜     |                    |
| 14     | Close Flashcard    | ⬜     |                    |
| 15     | Invalid Order      | ⬜     |                    |
| 16     | Multiple Orders    | ⬜     |                    |
| 17     | Backend API        | ⬜     |                    |
| 18     | Road Routing       | ⬜     |                    |
| 19     | Responsive Design  | ⬜     |                    |
| 20     | All Statuses       | ⬜     |                    |

Legend: ✅ Pass | ❌ Fail | ⬜ Not Tested

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Order not found"**

**Solution:** Make sure you're using the exact order ID from orders.json (e.g., FM100002, not fm100002)

### **Issue 2: Map not loading**

**Solution:** Check internet connection (needs OpenStreetMap tiles). Check console for errors.

### **Issue 3: Location permission not working**

**Solution:**

- Chrome: Check `chrome://settings/content/location`
- Clear site data and reload
- Make sure using HTTPS or localhost

### **Issue 4: Dropdown is empty**

**Solution:**

- Check backend is running
- Verify `GET /api/orders` works
- Check browser console for fetch errors

### **Issue 5: Route is a straight line**

**Solution:** This is the fallback if OSRM is unavailable. Check:

- Internet connection
- Console for "❌ Error fetching road route"
- OSRM service status: https://router.project-osrm.org

---

## 🎉 Testing Complete!

If all 20 tests pass, your FoodMandu Order Tracking system is fully functional! 🚀

**Next Steps:**

1. Run through critical tests (especially Test 5 - Live Tracking)
2. Fix any failures
3. Document any edge cases
4. Share with team for UAT (User Acceptance Testing)

**Happy Testing! 🧪✅**
