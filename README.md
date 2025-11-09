# SePay Next.js Integration

This is a Next.js application that integrates with SePay.vn webhook for checking incoming payments. It's designed to be deployed on Vercel.

## Features

- Create orders with payment amounts
- Display QR code and bank transfer instructions
- Real-time payment status checking via polling
- Webhook endpoint to receive payment notifications from SePay
- Automatic order status update when payment is received

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (for database) or PostgreSQL database
- SePay.vn account with webhook configuration

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Set Up Database

#### Option A: Using Supabase (Recommended for Vercel)

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and API keys from the project settings

#### Option B: Using PostgreSQL

1. Create a PostgreSQL database
2. Run the SQL schema from `supabase/schema.sql`
3. Set up connection pooling (recommended for serverless)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SePay Configuration (Optional - defaults are set in code)
NEXT_PUBLIC_SEPAY_BANK_CODE=MBBank
NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER=0903252427
NEXT_PUBLIC_SEPAY_ACCOUNT_NAME=Bùi Tấn Việt

# SePay API Key (Required for webhook authentication)
# Get your API key from SePay dashboard: Cấu hình Công ty > API Access
SEPAY_API_KEY=your_sepay_api_key_here

# App URL (for webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SEPAY_BANK_CODE` (optional)
   - `NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER` (optional)
   - `NEXT_PUBLIC_SEPAY_ACCOUNT_NAME` (optional)
   - `SEPAY_API_KEY` (required for webhook authentication)
   - `NEXT_PUBLIC_APP_URL` (your Vercel app URL)

4. Deploy

### 3. Configure SePay Webhook

1. Log in to your SePay.vn account
2. Go to "Tích hợp Webhooks" (Webhook Integration)
3. Click "+ Thêm webhooks" (Add webhook)
4. Fill in the details:
   - **Đặt tên** (Name): Give it a descriptive name
   - **Chọn sự kiện** (Choose event): Select "Có tiền vào" (Incoming funds)
   - **Chọn điều kiện** (Choose condition): Select your bank account(s)
   - **Gọi đến URL** (Call URL): `https://your-vercel-app.vercel.app/api/sepay-webhook`
   - **Kiểu chứng thực** (Authentication type): Configure API key authentication
     - If using Authorization header: Set header `Authorization: Bearer <your-api-key>`
     - If using custom header: Set header `X-API-Key: <your-api-key>` or `X-SePay-API-Key: <your-api-key>`
   - Make sure the API key matches the `SEPAY_API_KEY` in your environment variables
5. Save the webhook configuration

## How It Works

### Order Flow

1. User creates an order by entering an amount on the homepage
2. Order is saved to database with status "Unpaid"
3. User is redirected to checkout page (`/order/[id]`)
4. Checkout page displays:
   - QR code for mobile banking
   - Bank transfer instructions
   - Order details
5. Page polls payment status every second
6. When payment is received, SePay sends webhook to `/api/sepay-webhook`
7. Webhook handler:
   - Saves transaction to database
   - Extracts order ID from transaction content (format: DH{number})
   - Updates order status to "Paid" if order ID, amount, and status match
8. Checkout page detects payment status change and shows success message

### Webhook Data Structure

SePay sends the following data in the webhook:

```json
{
  "gateway": "string",
  "transactionDate": "string",
  "accountNumber": "string",
  "subAccount": "string",
  "transferType": "in" | "out",
  "transferAmount": number,
  "accumulated": number,
  "code": "string",
  "content": "string", // Contains order ID like "DH123"
  "referenceCode": "string",
  "description": "string"
}
```

### Order ID Format

The system expects the transaction content to contain an order ID in the format `DH{number}` (e.g., `DH123`). This is used to match payments to orders.

## API Endpoints

### POST `/api/orders`
Creates a new order.

**Request:**
```json
{
  "total": 3000
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 123,
  "order": { ... }
}
```

### GET `/api/orders/[id]`
Gets order details.

**Response:**
```json
{
  "success": true,
  "order": { ... }
}
```

### POST `/api/check-payment-status`
Checks payment status of an order.

**Request:**
```json
{
  "order_id": 123
}
```

**Response:**
```json
{
  "payment_status": "Paid" | "Unpaid" | "order_not_found"
}
```

### POST `/api/sepay-webhook`
Receives webhook from SePay. This endpoint is called by SePay when a payment is received.

## Database Schema

### tb_orders
- `id` (SERIAL PRIMARY KEY)
- `total` (DECIMAL)
- `name` (VARCHAR)
- `payment_status` (VARCHAR) - 'Unpaid' or 'Paid'
- `created_at` (TIMESTAMP)

### tb_transactions
- `id` (SERIAL PRIMARY KEY)
- `gateway` (VARCHAR)
- `transaction_date` (TIMESTAMP)
- `account_number` (VARCHAR)
- `sub_account` (VARCHAR)
- `amount_in` (DECIMAL)
- `amount_out` (DECIMAL)
- `accumulated` (DECIMAL)
- `code` (VARCHAR)
- `transaction_content` (TEXT)
- `reference_number` (VARCHAR)
- `body` (TEXT)
- `created_at` (TIMESTAMP)

## Security Considerations

1. **Webhook Verification**: Consider adding webhook signature verification if SePay supports it
2. **Rate Limiting**: Implement rate limiting on API endpoints
3. **Input Validation**: All inputs are validated, but consider additional sanitization
4. **Database Security**: Use Row Level Security (RLS) policies in Supabase for production
5. **Environment Variables**: Never commit `.env.local` to version control

## Troubleshooting

### Webhook not receiving data
- Check that the webhook URL is correctly configured in SePay
- Verify the URL is accessible (not localhost)
- Check Vercel function logs for errors

### Orders not updating to Paid
- Verify transaction content contains order ID in format `DH{number}`
- Check that order amount matches transaction amount
- Ensure order status is 'Unpaid' before payment
- Check database logs for errors

### Database connection issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify database schema is created correctly

## License

MIT

## References

- [SePay Documentation](https://docs.sepay.vn)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

