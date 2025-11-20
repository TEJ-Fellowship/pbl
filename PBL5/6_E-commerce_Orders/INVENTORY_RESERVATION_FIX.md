# Inventory Reservation Fix

## Problem

When attempting to checkout an order, the API was returning:
```json
{
  "success": false,
  "message": "Failed to reserve inventory"
}
```

## Root Cause

The `reserveInventory` function in `utils/redis.js` uses a Lua script to atomically reserve inventory from Redis cache. However, the inventory was **never synced to Redis cache** before attempting reservation.

### The Flow (Before Fix):

1. User adds items to cart ✅
2. User proceeds to checkout ✅
3. System fetches products and inventory from database ✅
4. System tries to reserve inventory in Redis ❌ **FAILS HERE**
   - Redis key `inventory:${productId}` doesn't exist
   - Lua script returns `INVENTORY_NOT_CACHED` error
   - Checkout fails with "Failed to reserve inventory"

### Why It Failed:

The `reserveInventory` function expects inventory to be cached in Redis at key `inventory:${productId}`. The Lua script checks:
```lua
local available = redis.call('GET', KEYS[1])
if not available then
  return {err = 'INVENTORY_NOT_CACHED'}
end
```

If the key doesn't exist, it returns an error. The `syncInventoryToCache` function existed but was **never called** before checkout.

## Solution

Modified `orderController.js` to sync inventory to Redis cache **before** attempting reservation:

### Changes Made:

1. **Added imports:**
   ```javascript
   const { syncInventoryToCache, getCachedInventory } = require('../utils/redis');
   ```

2. **Added inventory sync before reservation:**
   ```javascript
   // Sync inventory to Redis cache before reservation (if not already cached)
   for (const product of products) {
     const cartItem = cart[product.id];
     if (!cartItem) continue;

     // Check if inventory is already cached in Redis
     const cachedInventory = await getCachedInventory(product.id);
     
     // Only sync if not cached - if cached, use the cached value
     if (cachedInventory === null) {
       const available = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
       await syncInventoryToCache(product.id, available);
     }
   }
   ```

3. **Improved error messages:**
   - Added more detailed error messages for different failure scenarios
   - Better user feedback when inventory reservation fails

### The Flow (After Fix):

1. User adds items to cart ✅
2. User proceeds to checkout ✅
3. System fetches products and inventory from database ✅
4. **System syncs inventory to Redis cache (if not already cached)** ✅ **NEW STEP**
5. System reserves inventory in Redis (atomic operation) ✅
6. Order created in database ✅
7. Payment processed ✅

## Key Points

1. **Cache Check First:** We check if inventory is already cached before syncing. This prevents overwriting values that may have been updated by concurrent reservations.

2. **Available Quantity:** We sync the **available quantity** (quantity - reserved_quantity) to Redis, not the total quantity.

3. **Atomic Operations:** The Lua script in `reserveInventory` ensures atomic decrement operations, preventing race conditions.

4. **Error Handling:** Improved error messages help identify the specific issue (insufficient stock vs. cache error).

## Testing

To verify the fix works:

1. **Add items to cart:**
   ```http
   POST /api/cart/add
   {
     "productId": "your-product-id",
     "quantity": 2
   }
   ```

2. **Checkout:**
   ```http
   POST /api/orders/checkout
   {
     "shippingAddress": {
       "street": "123 Main St",
       "city": "New York",
       "state": "NY",
       "zipCode": "10001",
       "country": "USA"
     }
   }
   ```

3. **Expected Result:**
   - Order should be created successfully
   - No "Failed to reserve inventory" error
   - Inventory should be reserved in Redis
   - Order status should be "confirmed" (if payment succeeds)

## Files Modified

- `backend/controllers/orderController.js`
  - Added inventory sync before reservation
  - Improved error handling and messages
  - Added imports for `syncInventoryToCache` and `getCachedInventory`

## Related Files

- `backend/utils/redis.js` - Contains `reserveInventory`, `syncInventoryToCache`, and `getCachedInventory` functions
- `backend/models/Inventory.js` - Inventory model definition

## Additional Notes

- The inventory cache has a 5-minute TTL (300 seconds)
- If inventory is already cached, we use the cached value (which may be more up-to-date)
- The Lua script ensures atomic operations, preventing race conditions during concurrent checkouts
- Inventory is released back to Redis if payment fails

---

**Date Fixed:** 2024-11-20  
**Issue:** "Failed to reserve inventory" error during checkout  
**Status:** ✅ Fixed

