# 🚀 Quick Start Guide - FoodMandu Order Tracking

## ⚡ 60-Second Quick Start

### 1️⃣ Start Backend (Terminal 1)

```bash
cd backend
npm start
```

✅ Backend running on `http://localhost:5000`

### 2️⃣ Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

✅ Frontend running on `http://localhost:5173`

### 3️⃣ Track an Order

1. Open `http://localhost:5173` in browser
2. In sidebar, click dropdown "Select an order..."
3. Choose: **"ORD-2025-000002 - Himalayan Flavours (on_the_way)"**
4. Click **"Track"** button
5. **🎉 Watch the live map with moving delivery person!**

---

## 🎯 Best Orders to Test

| Order ID     | Restaurant         | Status          | Why Test It?                                      |
| ------------ | ------------------ | --------------- | ------------------------------------------------- |
| **FM100002** | Himalayan Flavours | **on_the_way**  | ⭐ **BEST!** Live map, moving marker, blue routes |
| FM100001     | Bajeko Sekuwa      | order_ready     | Ready for pickup, no map yet                      |
| FM100009     | Himalayan Flavours | order_preparing | Animated "preparing" screen                       |
| FM100003     | Bajeko Sekuwa      | delivered       | Completed order                                   |

---

## 📍 Location Permission

When you first track an order:

- 📱 Browser will ask for location permission
- ✅ **Allow** → Map uses your real GPS location
- ❌ **Block** → Map uses order's delivery address (still works!)

---

## 🗺️ What to Expect

### When Order is "on_the_way" (Stage 4):

- ✅ **Live interactive map**
- ✅ **3 markers:**
  - 🏪 Restaurant (start)
  - 🚴 Delivery person (moving every 5 seconds!)
  - 📍 Your location (destination)
- ✅ **Blue route line** following actual roads
- ✅ **Driver info:** Name, phone, vehicle
- ✅ **Real-time ETA** updates
- ✅ **🔴 LIVE badge** on map

### Before Order is "on_the_way" (Stages 1-3):

- 📊 Progress timeline
- ⏰ ETA countdown
- 📦 Order items & pricing
- 🎨 Animated "Preparing" placeholder
- ❌ No map yet (activates when delivery starts)

---

## 💬 Try Chat Commands

Type these in the chat:

- `track my order FM100002`
- `track order ORD-2025-000002`
- `where is my order FM100005`

The bot will automatically detect and track the order!

---

## 🌍 Switch Language

Click the language buttons in sidebar:

- **English** → English
- **नेपाली** → Nepali

All UI elements update instantly!

---

## 📊 Available Orders

**20 test orders** across all statuses:

- **3 orders** - order_placed (just received)
- **5 orders** - order_preparing (cooking)
- **3 orders** - order_ready (waiting for driver)
- **4 orders** - on_the_way (🚴 **LIVE TRACKING**)
- **5 orders** - delivered (completed)

---

## 🔧 Troubleshooting

### Problem: Dropdown is empty

**Fix:** Backend not running. Start with `cd backend && npm start`

### Problem: Map not loading

**Fix:** Check internet (needs OpenStreetMap). Check console for errors.

### Problem: "Order not found"

**Fix:** Use exact order ID from dropdown (e.g., FM100002 not fm100002)

### Problem: Location permission stuck

**Fix:** Reload page and allow/block again

---

## 📱 Mobile Testing

Works on mobile! Try:

1. Get your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `vite.config.js` to allow network access
3. Access from phone: `http://[YOUR-IP]:5173`

---

## 🎓 Learn More

For detailed information, see:

- **IMPLEMENTATION_COMPLETE.md** - Full feature list
- **TEST_SCENARIOS.md** - 20 comprehensive tests
- **ORDER_DATA_STRUCTURE.md** - Data format guide
- **ORDER_TRACKING_GUIDE.md** - Tracking system details

---

## 🎉 You're All Set!

**Recommended first test:**

1. Track order **FM100002** (on_the_way)
2. Allow location permission
3. Watch the live map
4. See the delivery person move in real-time
5. Click markers to see popups

**Enjoy your live order tracking! 🚴‍♂️🗺️✨**
