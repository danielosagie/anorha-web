# Authentication Setup Guide for Web Frontend

## Overview

We've simplified the web authentication flow by:

1. **Removing Next.js API route proxies** - Direct calls to the backend with Supabase JWTs
2. **Using Clerk + Supabase token exchange** - Client-side token exchange with automatic refresh
3. **Setting explicit API base URL** - Ensuring the frontend knows where the backend is

## Required Environment Variables

For **local development** (`.env.local`), you need:

```env
# Backend API URL (required for local dev)
NEXT_PUBLIC_API_URL=http://localhost:3333

# Supabase (optional for local dev)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PostHog Analytics (optional - can be skipped for local dev)
# NEXT_PUBLIC_POSTHOG_KEY=phc_...
# NEXT_PUBLIC_POSTHOG_HOST=https://...

# Clerk keys (these should already be set)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...
```

## How the Auth Flow Works Now

### 1. Component Initialization
```typescript
const { initializeSupabase, getSupabaseToken } = useSupabaseAuth();

useEffect(() => {
  const ready = await initializeSupabase();
  setAuthReady(ready);
}, [initializeSupabase]);
```

### 2. Token Exchange
- User is signed in with Clerk
- `initializeSupabase()` calls `getToken()` to get Clerk JWT
- Clerk JWT is sent to `http://localhost:3333/api/auth/exchange`
- Backend returns Supabase JWT
- Token is stored in `currentSupabaseJwt`

### 3. Making API Calls
```typescript
const token = getSupabaseToken();
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const res = await fetch(`${API_BASE}/api/pools/org/${orgId}`, { 
  headers,
  cache: 'no-store'
});
```

## Troubleshooting

### "Not authenticated" (401 errors)
1. Check browser console for `[supabase.ts]` logs
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure backend `/api/auth/exchange` endpoint exists
4. Check Clerk session is active (`useAuth()` hook should have a token)

### SSL/TLS Errors
1. Verify `NEXT_PUBLIC_API_URL` is `http://` (not `https://`) for local dev
2. Check that the URL doesn't have typos
3. Look for `[supabase.ts] Exchange URL:` log to see what URL is actually being called

### Token Exchange Timeout
1. Backend might not be running - check `http://localhost:3333/api/health`
2. Network might be blocked - check browser network tab
3. Check backend logs for errors during token exchange

## Files Changed

1. **`lib/supabase.ts`** (NEW)
   - Client-side Supabase JWT management
   - Clerk token exchange logic
   - `useSupabaseAuth()` hook for components

2. **`env.ts`**
   - Added `NEXT_PUBLIC_API_URL` to allowed environment variables

3. **`app/(authenticated)/team/components/MemberPermissionsPage.tsx`**
   - Now uses `useSupabaseAuth()` hook
   - Direct backend calls with JWT tokens
   - Removed Next.js API route proxies

4. **`packages/analytics/keys.ts`**
   - Made PostHog keys optional for local dev

5. **`packages/analytics/posthog/client.tsx`**
   - Added check for missing PostHog configuration

6. **`packages/analytics/posthog/server.ts`**
   - Added check for missing PostHog configuration

## Running Locally

```bash
# Terminal 1: Start the backend
cd sssync-bknd
npm run start:dev

# Terminal 2: Start the web frontend with explicit API URL
cd anorha/apps/app
NEXT_PUBLIC_API_URL=http://localhost:3333 npm run dev
```

The web app should now:
1. ✅ Load without PostHog errors
2. ✅ Exchange Clerk tokens for Supabase JWTs automatically
3. ✅ Make direct API calls to your local backend
4. ✅ Load pools and member permissions

## Next Steps

1. Verify the backend `/api/auth/exchange` endpoint is working
2. Check browser DevTools Console for `[supabase.ts]` logs during page load
3. Monitor network tab to see actual API calls being made




