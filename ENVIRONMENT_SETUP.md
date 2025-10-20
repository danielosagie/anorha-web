# Environment Setup for Anorha

## Required Environment Variables

Create a `.env.local` file in `/Users/dosagie/Documents/CodeProjects/anorha/apps/app/` with the following variables:

### Frontend (Next.js App)
```bash
# App URL - Set to your frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://app.anorha.app

# Backend API URL - Set to your NestJS backend
NEXT_PUBLIC_API_URL=http://localhost:3333
# For production: NEXT_PUBLIC_API_URL=https://api.sssync.app

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Polar.sh Integration
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SUCCESS_URL=http://localhost:3000/billing?success=true
# For production: POLAR_SUCCESS_URL=https://app.anorha.app/billing?success=true

# Stripe Integration (existing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_GROWTH=price_growth_id
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_BUSINESS=price_business_id
STRIPE_PRICE_SCALE=price_scale_id
STRIPE_PRICE_IMPORT_ADDON=price_import_addon_id
STRIPE_PRICE_MARKETPLACE_SYNC_ADDON=price_marketplace_sync_addon_id

# Billing Return URL
BILLING_RETURN_URL=http://localhost:3000/billing
# For production: BILLING_RETURN_URL=https://app.anorha.app/billing

# Optional: Liveblocks (if you want to re-enable collaboration)
LIVEBLOCKS_SECRET=your_liveblocks_secret
```

### Backend (NestJS API)
Create a `.env` file in `/Users/dosagie/Documents/CodeProjects/sssync-bknd/` with:

```bash
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_GROWTH=price_growth_id
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_BUSINESS=price_business_id
STRIPE_PRICE_SCALE=price_scale_id
STRIPE_PRICE_IMPORT_ADDON=price_import_addon_id
STRIPE_PRICE_MARKETPLACE_SYNC_ADDON=price_marketplace_sync_addon_id

# Billing Return URL
BILLING_RETURN_URL=http://localhost:3000/billing
# For production: BILLING_RETURN_URL=https://app.anorha.app/billing

# Auth Exchange Endpoint (for Clerk to Supabase token exchange)
# This should match your frontend NEXT_PUBLIC_API_URL
```

## Current Issues Fixed

1. **Header Navigation**: Added Header component to billing page with proper breadcrumbs and sidebar trigger
2. **Progress Bar Colors**: Fixed Progress component to accept `indicatorClassName` prop for custom colors
3. **API URL Configuration**: Updated billing data fetching to use `NEXT_PUBLIC_APP_URL` with fallback

## Testing the Setup

1. Set the environment variables above
2. Start both services:
   ```bash
   # Terminal 1: Frontend
   cd /Users/dosagie/Documents/CodeProjects/anorha
   npm run dev
   
   # Terminal 2: Backend (if running separately)
   cd /Users/dosagie/Documents/CodeProjects/sssync-bknd
   npm run start:dev
   ```

3. Visit `http://localhost:3000/billing` and test:
   - Header navigation (sidebar toggle, breadcrumbs)
   - Billing buttons (should now work with proper API calls)
   - Progress bars (should show custom colors)

## Production Deployment

For production deployment:
- Update `NEXT_PUBLIC_APP_URL` to `https://app.anorha.app`
- Update `NEXT_PUBLIC_API_URL` to `https://api.sssync.app`
- Update `POLAR_SUCCESS_URL` to `https://app.anorha.app/billing?success=true`
- Update `BILLING_RETURN_URL` to `https://app.anorha.app/billing`
