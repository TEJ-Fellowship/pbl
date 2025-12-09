# Frontend Payment Page

Simple HTML page for testing Stripe payment integration.

## How to Use

1. **Start your backend server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Create a booking** (using `myrequests.rest` or API):

   ```bash
   POST http://localhost:3001/api/bookings
   {
     "seat_ids": ["seat1", "seat2", "seat3"]
   }
   ```

3. **Wait 2-3 seconds** for Payment Intent to be created (Kafka processing)

4. **Open the payment page** in your browser:

   ```
   http://localhost:3001/payment.html?booking_id=YOUR_BOOKING_ID
   ```

   Replace `YOUR_BOOKING_ID` with the booking ID from step 2.

5. **Enter test card details:**

   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)

6. **Click "Pay Now"** - Payment will be processed and webhook will update booking status

## Features

- ✅ Fetches booking details automatically
- ✅ Shows booking info (seats, amount, status)
- ✅ Stripe.js integration for secure card input
- ✅ Real-time payment processing
- ✅ Automatic polling for booking confirmation
- ✅ Beautiful, responsive UI

## API Endpoints Used

- `GET /api/payments/config` - Gets Stripe publishable key
- `GET /api/bookings/:id` - Gets booking details (including `client_secret`)
- Frontend calls Stripe API directly (not your backend) for payment confirmation

## Flow

1. Frontend loads → Gets publishable key from backend
2. Frontend loads → Gets booking with `client_secret` from backend
3. User enters card → Frontend sends to Stripe (via Stripe.js)
4. Stripe processes → Sends webhook to your backend
5. Backend updates → Booking status changes to "confirmed"
6. Frontend polls → Detects booking confirmation

## Troubleshooting

- **"No booking ID provided"**: Add `?booking_id=YOUR_ID` to URL
- **"Payment Intent not ready"**: Wait 2-3 seconds after creating booking
- **"Stripe publishable key not configured"**: Check your `.env` file has `STRIPE_PUBLISHABLE_KEY`
- **Payment succeeds but booking not confirmed**: Check webhook endpoint is working and Stripe CLI is forwarding webhooks (if testing locally)
