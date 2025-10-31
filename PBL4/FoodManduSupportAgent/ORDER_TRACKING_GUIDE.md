# 🚀 FoodMandu Order Tracking System - Complete Guide

## Overview

The order tracking system is now **fully functional** with real-time progression, dynamic ETA calculation, and live map tracking!

---

## ⏱️ **How the Time-Based System Works**

### Stage Progression (2 minutes per stage)

The system divides the order lifecycle into **5 stages**, each lasting **2 minutes**:

| Stage | Name                         | Duration | What Happens                    |
| ----- | ---------------------------- | -------- | ------------------------------- |
| 1     | **Order Placed**             | 2 min    | Order received and confirmed    |
| 2     | **Order being Prepared**     | 2 min    | Restaurant is cooking your food |
| 3     | **Order Ready for Delivery** | 2 min    | Food is packed and ready        |
| 4     | **Order is on the Way**      | 2 min    | Delivery person is en route 🚴  |
| 5     | **Order Delivered**          | -        | Food arrives! 🎉                |

**Total Time**: 8 minutes from order placement to delivery

---

## 📊 **Dynamic ETA Calculation**

The ETA (Estimated Time of Arrival) is calculated dynamically:

```
ETA = (Remaining Stages × 2 minutes) + Time Left in Current Stage
```

### Example Timeline:

- **Minute 0**: Order Placed → ETA: **8 minutes**
- **Minute 2**: Order being Prepared → ETA: **6 minutes**
- **Minute 4**: Order Ready for Delivery → ETA: **4 minutes**
- **Minute 6**: Order is on the Way → ETA: **2 minutes**
- **Minute 8**: Order Delivered → ETA: **0 minutes**

The ETA updates every 5 seconds as the system polls the backend!

---

## 🗺️ **Live Map Functionality**

### When Does the Map Appear?

The **interactive real-time map** appears when:

- Stage reaches **"Order is on the Way"** (Stage 4)
- After 6 minutes from order placement

### Before Stage 4:

Shows a beautiful placeholder with:

- ⏰ Animated clock icon
- "Preparing Your Order" message
- Pulsing dots animation

### During Stage 4 (Live Tracking):

Shows **real Leaflet map** with:

- 🏪 **Restaurant marker** (starting point)
- 🚴 **Delivery person marker** (moving in real-time)
- 📍 **Destination marker** (your location)
- 📈 **Route line** (dotted path showing delivery route)
- 🔴 **LIVE badge** (indicating real-time tracking)

---

## 🎬 **Delivery Animation**

The delivery person **moves automatically** from restaurant to your location:

### Animation Logic:

```javascript
// During Stage 4 (2 minutes = 120 seconds)
progress = timeInCurrentStage / 2  // 0.0 to 1.0

// Delivery person location interpolates between:
// Start: Restaurant (27.7172, 85.3240)
// End: Destination (27.7100, 85.3300)

currentLat = restaurantLat + (destinationLat - restaurantLat) × progress
currentLng = restaurantLng + (destinationLng - restaurantLng) × progress
```

**Result**: Smooth movement from restaurant to your location over 2 minutes!

---

## 🎯 **Testing the System**

### Method 1: Quick Test (Simulated Time)

The backend simulates an order placed **12 minutes ago**, so you can see different stages:

```bash
# Current implementation shows stage based on:
orderPlacedTime = now - 12 minutes
elapsedMinutes = 12 minutes
currentStage = floor(12 / 2) = Stage 6 (but capped at Stage 5)
```

To see different stages, modify backend code:

```javascript
// In backend/src/controllers/qacontrollers.js line 135
const orderPlacedTime = new Date(Date.now() - X * 60 * 1000);

// Replace X with:
// 0 minutes → Stage 1: Order Placed
// 2 minutes → Stage 2: Order being Prepared
// 4 minutes → Stage 3: Order Ready for Delivery
// 6 minutes → Stage 4: Order is on the Way (LIVE MAP!)
// 8 minutes → Stage 5: Order Delivered
```

### Method 2: Watch Real-Time Progression

1. **Set order to 5 minutes ago** (to see Stage 3):

   ```javascript
   const orderPlacedTime = new Date(Date.now() - 5 * 60 * 1000);
   ```

2. **Wait 1 minute** → Stage changes to 4 (Live map appears!)

3. **Watch delivery person move** in real-time!

---

## 🔄 **Real-Time Updates**

- **Polling Interval**: Every **5 seconds**
- **Backend Calculation**: Fresh ETA and location on each request
- **Map Updates**: Automatically recenters on delivery person
- **Progress Bar**: Updates with current stage highlight

---

## 🎨 **UI Features**

### Progress Steps:

- ✅ **Green background** = Completed
- 🟡 **Yellow background** = Current (animated pulse)
- ⚪ **Gray background** = Not started
- **Timestamps** shown for completed stages

### Map Features:

- **Custom Icons**: Yellow delivery person, Red destination pin
- **Route Line**: Dotted yellow line showing path
- **Popups**: Click markers for details
- **Live Badge**: Red "LIVE" indicator in top-left
- **Auto-centering**: Follows delivery person

### Driver Information:

- Only shown during live tracking (Stage 4)
- **Clickable phone number** for direct call
- Vehicle details and license plate

---

## 📱 **Testing Instructions**

### Quick Test Flow:

1. **Start the servers**:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open browser**: `http://localhost:5173`

3. **Track an order**:

   - Click "Track Order" button, OR
   - Type: "track my order"
   - Enter Order ID: `FM123`
   - Enter Location: `Kathmandu`

4. **Watch the magic**:
   - See current stage and ETA
   - If stage is 4+, see live map with moving delivery person!
   - ETA counts down in real-time

---

## 🔧 **Customization Options**

### Change Stage Duration:

```javascript
// In backend/src/controllers/qacontrollers.js line 140
const stageMinutes = 2; // Change to 1, 3, 5, etc.
```

### Change Update Frequency:

```javascript
// In frontend/src/components/TrackOrderFlashcard.jsx line 107
const interval = setInterval(fetchTrackingData, 5000); // Change 5000 to desired ms
```

### Change Locations:

```javascript
// In backend/src/controllers/qacontrollers.js lines 196-199
const restaurantLat = 27.7172; // Restaurant coordinates
const restaurantLng = 85.324;
const destinationLat = 27.71; // Your location
const destinationLng = 85.33;
```

---

## 🎯 **API Response Example**

```json
{
  "success": true,
  "data": {
    "orderId": "FM123",
    "restaurantLocation": "Kathmandu",
    "eta": 2,
    "status": "Order is on the Way",
    "currentStage": 3,
    "orderPlacedAt": "2025-10-21T02:00:00.000Z",
    "elapsedMinutes": 6,
    "location": {
      "lat": 27.7136,
      "lng": 85.3270
    },
    "destination": {
      "lat": 27.7100,
      "lng": 85.3300
    },
    "restaurant": {
      "lat": 27.7172,
      "lng": 85.3240
    },
    "driver": {
      "name": "Ram Kumar",
      "phone": "+977-9841234567",
      "vehicle": "Motorcycle",
      "vehicleNumber": "BA-1-PA-1234"
    },
    "progress": {
      "steps": [...]
    }
  }
}
```

---

## 🚀 **Production Deployment Tips**

1. **Remove Debug Info**: Delete the debug info section in TrackOrderFlashcard.jsx

2. **Store Order Time in Database**:

   ```javascript
   // Instead of simulating time:
   const order = await Order.findOne({ orderId });
   const orderPlacedTime = new Date(order.createdAt);
   ```

3. **Real GPS Integration**:

   - Integrate with actual delivery partner API
   - Replace simulated location with real GPS data

4. **WebSocket for Real-Time**:

   - Replace polling with WebSocket connection
   - Push updates instead of pulling

5. **Error Handling**:
   - Add retry logic for failed requests
   - Offline mode support

---

## 🎉 **Features Completed**

✅ Time-based progression (2 min per stage)  
✅ Dynamic ETA calculation  
✅ Real-time map (appears at Stage 4)  
✅ Animated delivery person movement  
✅ Progress tracking with timestamps  
✅ Driver information display  
✅ Auto-updating every 5 seconds  
✅ Beautiful UI with loading states  
✅ Multilingual support (EN/NP)  
✅ Mobile responsive design

---

## 📞 **Support**

For questions or issues, check:

- Backend logs: `backend/` terminal
- Frontend console: Browser DevTools (F12)
- API health: `http://localhost:5000/api/health`

---

**Enjoy your fully functional real-time order tracking system! 🎊**
