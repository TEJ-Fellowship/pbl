# 📋 Order Data Structure for Tracking System

## 🎯 Required Data for Complete Order Tracking

### 1. **Order Information** 📦

```javascript
{
  // Basic Order Info
  orderId: "FM123456",              // Unique order identifier
  orderNumber: "ORD-2025-001234",   // Human-readable order number
  status: "preparing",               // Current order status
  createdAt: "2025-10-21T08:30:00Z", // Order placement timestamp

  // Order Items
  items: [
    {
      itemId: "ITEM001",
      name: "Chicken Momo",
      quantity: 2,
      price: 250,
      specialInstructions: "Extra spicy"
    },
    {
      itemId: "ITEM002",
      name: "Fried Rice",
      quantity: 1,
      price: 180
    }
  ],

  // Pricing
  subtotal: 680,
  deliveryFee: 50,
  tax: 68,
  discount: 0,
  total: 798,
  paymentMethod: "cash",  // or "online", "card"
  paymentStatus: "pending" // or "paid", "refunded"
}
```

---

### 2. **Customer Information** 👤

```javascript
{
  customer: {
    customerId: "CUST123",
    name: "Ram Kumar",
    phone: "+977-9841234567",
    email: "ram.kumar@example.com",

    // Delivery Address
    deliveryAddress: {
      street: "Thamel Street, Near Kathmandu Guest House",
      area: "Thamel",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      postalCode: "44600",
      landmark: "Near Pumpernickel Bakery",

      // GPS Coordinates (CRITICAL for tracking!)
      latitude: 27.7100,
      longitude: 85.3300,

      // Address Type
      type: "home", // or "work", "other"
      label: "Home"
    },

    // Alternate Contact (optional)
    alternatePhone: "+977-9801234567"
  }
}
```

---

### 3. **Restaurant Information** 🏪

```javascript
{
  restaurant: {
    restaurantId: "REST456",
    name: "Himalayan Momo House",
    phone: "+977-9851234567",

    // Restaurant Address
    address: {
      street: "Durbar Marg",
      area: "Durbar Marg",
      city: "Kathmandu",

      // GPS Coordinates (CRITICAL for routing!)
      latitude: 27.7172,
      longitude: 85.3240
    },

    // Operating Hours
    openTime: "10:00",
    closeTime: "22:00",

    // Preparation Time
    estimatedPrepTime: 20 // minutes
  }
}
```

---

### 4. **Delivery Information** 🚚

```javascript
{
  delivery: {
    // Delivery Person (assigned when order is picked up)
    driver: {
      driverId: "DRV789",
      name: "Santosh Lama",
      phone: "+977-9841234567",
      vehicle: {
        type: "motorcycle", // or "bicycle", "scooter", "car"
        number: "BA-1-PA-1234",
        model: "Honda Activa"
      },
      rating: 4.8,
      totalDeliveries: 1234
    },

    // Current Location (updated in real-time)
    currentLocation: {
      latitude: 27.7145,
      longitude: 85.3270,
      lastUpdated: "2025-10-21T08:45:00Z",
      accuracy: 10, // meters
      speed: 25 // km/h (optional)
    },

    // Delivery Status
    status: "on_the_way", // or "assigned", "picked_up", "delivered"

    // Timestamps
    assignedAt: "2025-10-21T08:35:00Z",
    pickedUpAt: "2025-10-21T08:40:00Z",
    expectedDeliveryAt: "2025-10-21T09:00:00Z",
    actualDeliveryAt: null, // filled when delivered

    // Route Information
    roadRoute: [[27.7172, 85.3240], [27.7165, 85.3245], ...], // array of [lat, lng]
    estimatedDistance: 2.3, // kilometers
    estimatedDuration: 12, // minutes

    // Delivery Instructions
    instructions: "Ring doorbell, leave at gate if no answer",
    contactlessDelivery: false,

    // Delivery Fee
    deliveryFee: 50,
    deliveryType: "standard" // or "express", "scheduled"
  }
}
```

---

### 5. **Order Timeline** ⏱️

```javascript
{
  timeline: [
    {
      stage: "order_placed",
      status: "completed",
      timestamp: "2025-10-21T08:30:00Z",
      description: "Order received and confirmed"
    },
    {
      stage: "order_preparing",
      status: "completed",
      timestamp: "2025-10-21T08:32:00Z",
      description: "Restaurant is preparing your order",
      estimatedCompletion: "2025-10-21T08:50:00Z"
    },
    {
      stage: "order_ready",
      status: "completed",
      timestamp: "2025-10-21T08:48:00Z",
      description: "Order is ready for pickup"
    },
    {
      stage: "on_the_way",
      status: "in_progress",
      timestamp: "2025-10-21T08:52:00Z",
      description: "Delivery person is on the way",
      estimatedCompletion: "2025-10-21T09:00:00Z"
    },
    {
      stage: "delivered",
      status: "pending",
      timestamp: null,
      description: "Order will be delivered soon"
    }
  ],

  // Current ETA (dynamically calculated)
  currentETA: 8, // minutes
  currentStage: 3, // 0-4 (order_placed, preparing, ready, on_the_way, delivered)
  elapsedMinutes: 22 // time since order placed
}
```

---

### 6. **Notifications & Communication** 📱

```javascript
{
  notifications: {
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,

    // Notification History
    sent: [
      {
        type: "order_confirmed",
        channel: "sms",
        timestamp: "2025-10-21T08:30:00Z",
        status: "delivered"
      },
      {
        type: "driver_assigned",
        channel: "push",
        timestamp: "2025-10-21T08:35:00Z",
        status: "delivered"
      }
    ]
  },

  // Chat Messages (optional)
  messages: [
    {
      from: "customer",
      to: "driver",
      message: "I'm on the 3rd floor",
      timestamp: "2025-10-21T08:55:00Z",
      read: true
    }
  ]
}
```

---

## 🎨 Order Form Fields Required

### **Minimum Required Fields:**

```javascript
// For placing an order
const orderForm = {
  // Customer Info (if not logged in)
  customerName: "Required",
  customerPhone: "Required",
  customerEmail: "Optional",

  // Delivery Address
  deliveryStreet: "Required",
  deliveryArea: "Required",
  deliveryCity: "Required",
  deliveryLatitude: "Auto-captured or manual", // CRITICAL!
  deliveryLongitude: "Auto-captured or manual", // CRITICAL!
  deliveryLandmark: "Optional but recommended",
  deliveryInstructions: "Optional",

  // Restaurant (auto-filled from selection)
  restaurantId: "Required",
  restaurantLatitude: "Auto-filled", // CRITICAL!
  restaurantLongitude: "Auto-filled", // CRITICAL!

  // Order Items
  items: [
    {
      itemId: "Required",
      quantity: "Required",
      specialInstructions: "Optional",
    },
  ],

  // Delivery Options
  deliveryType: "Required (standard/express)",
  scheduledTime: "Optional (for scheduled delivery)",
  contactlessDelivery: "Optional (boolean)",

  // Payment
  paymentMethod: "Required (cash/online/card)",
};
```

---

## 📱 Sample Order Creation Form (React/HTML)

```jsx
// Customer Information Section
<FormSection title="Customer Information">
  <Input
    name="customerName"
    label="Full Name"
    required
    placeholder="Ram Kumar"
  />
  <Input
    name="customerPhone"
    label="Phone Number"
    required
    type="tel"
    placeholder="+977-9841234567"
  />
  <Input
    name="customerEmail"
    label="Email"
    type="email"
    placeholder="ram.kumar@example.com"
  />
</FormSection>

// Delivery Address Section
<FormSection title="Delivery Address">
  <Input
    name="deliveryStreet"
    label="Street Address"
    required
    placeholder="Thamel Street, Near Kathmandu Guest House"
  />
  <Input
    name="deliveryArea"
    label="Area"
    required
    placeholder="Thamel"
  />
  <Input
    name="deliveryCity"
    label="City"
    required
    value="Kathmandu"
  />
  <Input
    name="deliveryLandmark"
    label="Nearby Landmark"
    placeholder="Near Pumpernickel Bakery"
  />

  {/* GPS Location Capture */}
  <LocationPicker
    onLocationSelect={(lat, lng) => {
      setDeliveryLatitude(lat);
      setDeliveryLongitude(lng);
    }}
    buttonText="Get My Current Location"
    required
  />

  <Textarea
    name="deliveryInstructions"
    label="Delivery Instructions"
    placeholder="Ring doorbell, 3rd floor"
  />
</FormSection>

// Order Items Section
<FormSection title="Order Items">
  {items.map((item, index) => (
    <ItemRow key={index}>
      <Select
        name={`items[${index}].itemId`}
        label="Item"
        options={menuItems}
        required
      />
      <Input
        name={`items[${index}].quantity`}
        label="Quantity"
        type="number"
        min="1"
        required
      />
      <Input
        name={`items[${index}].specialInstructions`}
        label="Special Instructions"
        placeholder="Extra spicy"
      />
    </ItemRow>
  ))}
  <Button onClick={addItem}>+ Add Item</Button>
</FormSection>

// Delivery Options
<FormSection title="Delivery Options">
  <RadioGroup name="deliveryType" required>
    <Radio value="standard" label="Standard (20-30 min) - Rs. 50" />
    <Radio value="express" label="Express (10-15 min) - Rs. 100" />
  </RadioGroup>

  <Checkbox
    name="contactlessDelivery"
    label="Contactless Delivery"
  />

  <DateTimePicker
    name="scheduledTime"
    label="Schedule for Later (Optional)"
  />
</FormSection>

// Payment
<FormSection title="Payment">
  <RadioGroup name="paymentMethod" required>
    <Radio value="cash" label="Cash on Delivery" />
    <Radio value="online" label="Pay Online" />
    <Radio value="card" label="Credit/Debit Card" />
  </RadioGroup>
</FormSection>

// Order Summary
<OrderSummary>
  <SummaryRow label="Subtotal" value="Rs. 680" />
  <SummaryRow label="Delivery Fee" value="Rs. 50" />
  <SummaryRow label="Tax" value="Rs. 68" />
  <SummaryRow label="Total" value="Rs. 798" bold />
</OrderSummary>

<Button type="submit" size="large">
  Place Order
</Button>
```

---

## 🗄️ Database Schema (MongoDB Example)

```javascript
// orders collection
{
  _id: ObjectId("..."),
  orderId: "FM123456",
  orderNumber: "ORD-2025-001234",

  // Customer
  customer: {
    customerId: ObjectId("..."),
    name: String,
    phone: String,
    email: String,
    deliveryAddress: {
      street: String,
      area: String,
      city: String,
      latitude: Number, // CRITICAL
      longitude: Number, // CRITICAL
      landmark: String,
      instructions: String
    }
  },

  // Restaurant
  restaurant: {
    restaurantId: ObjectId("..."),
    name: String,
    phone: String,
    latitude: Number, // CRITICAL
    longitude: Number, // CRITICAL
    address: Object
  },

  // Order Items
  items: [
    {
      itemId: ObjectId("..."),
      name: String,
      quantity: Number,
      price: Number,
      specialInstructions: String
    }
  ],

  // Pricing
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  discount: Number,
  total: Number,

  // Payment
  paymentMethod: String,
  paymentStatus: String,

  // Delivery
  delivery: {
    driver: {
      driverId: ObjectId("..."),
      name: String,
      phone: String,
      vehicle: Object
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    status: String,
    roadRoute: [[Number]], // Array of [lat, lng]
    estimatedDistance: Number,
    estimatedDuration: Number,
    deliveryInstructions: String
  },

  // Timeline
  timeline: [
    {
      stage: String,
      status: String,
      timestamp: Date,
      description: String
    }
  ],

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  status: String
}
```

---

## 🎯 Critical Fields for Tracking

### **Must Have:**

1. ✅ **Customer Delivery Location** (lat, lng) - For destination
2. ✅ **Restaurant Location** (lat, lng) - For origin
3. ✅ **Order Creation Time** - For stage calculation
4. ✅ **Order ID** - For tracking lookup

### **Highly Recommended:**

5. ✅ **Driver Current Location** (lat, lng) - For real-time tracking
6. ✅ **Road Route** - For showing path on map
7. ✅ **Timeline** - For progress tracking
8. ✅ **Customer Phone** - For contact/communication

### **Optional but Useful:**

9. ⭐ **Delivery Instructions** - For driver
10. ⭐ **Special Instructions** - For restaurant
11. ⭐ **Alternative Phone** - For backup contact

---

## 💡 Pro Tips

1. **Always Capture GPS Coordinates:**

   - Use browser's `navigator.geolocation` API
   - Provide manual map picker as fallback
   - Validate coordinates before saving

2. **Store Order Creation Time:**

   - Use ISO 8601 format with timezone
   - Store in UTC, convert to local for display

3. **Cache Road Routes:**

   - Calculate once, store in database
   - Reuse for all subsequent tracking requests
   - Reduces API calls and improves performance

4. **Real-time Updates:**
   - Update driver location every 5-10 seconds
   - Store in database or cache (Redis)
   - Push to frontend via WebSocket or polling

---

## 🚀 Quick Start Checklist

- [ ] Create order form with customer info
- [ ] Add address fields (including GPS)
- [ ] Implement location picker/capture
- [ ] Add restaurant selection (with coordinates)
- [ ] Create order items selection
- [ ] Add delivery options
- [ ] Implement payment method selection
- [ ] Store order with timestamp
- [ ] Assign driver (manual or automatic)
- [ ] Start tracking when delivery begins

---

**With this data structure, your tracking system will work perfectly! 🎊**
