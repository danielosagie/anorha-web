# API Requests Guide

## Overview

This guide explains the correct way to make API requests in the Anorha frontend. The key principle is: **Frontend components should NEVER call the backend directly**. Instead, they should call frontend API routes that handle authentication.

## ❌ WRONG: Direct Backend Calls (Causes "Failed to fetch")

```typescript
// WRONG - This will fail with "TypeError: Failed to fetch"
const API_BASE = 'https://api.sssync.app'; // Or http://localhost:3333

const response = await fetch(`${API_BASE}/api/organizations/${orgId}/permissions`, {
  headers: {
    'Authorization': `Bearer ${someToken}`, // How do you get this token?
  },
});
```

## ✅ CORRECT: Frontend API Routes

```typescript
// CORRECT - Call frontend API routes
const API_BASE = '/api'; // Frontend routes handle authentication

const response = await fetch(`${API_BASE}/organizations/${orgId}/permissions`, {
  // No Authorization header needed - frontend routes handle it
  cache: 'no-store', // Important for dynamic data
});
```

## How Authentication Works

### 1. Frontend API Routes Handle Token Exchange

Frontend API routes automatically:
- Get Clerk JWT token from the request session
- Exchange it for a Supabase JWT token
- Forward the request to the backend with proper authentication

### 2. Example Frontend API Route

```typescript
// File: apps/app/app/api/organizations/[orgId]/schema/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../billing/_utils';

export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    // 1. Automatically get Clerk token and exchange for Supabase token
    const { token, apiBase } = await getSupabaseToken();

    // 2. Forward request to backend with proper authentication
    const res = await fetch(`${apiBase}/organizations/${params.orgId}/schema`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Supabase JWT token
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // 3. Return backend response
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Common API Patterns

### 1. GET Requests

```typescript
// Frontend component
const response = await fetch(`/api/organizations/${orgId}/pools`, {
  cache: 'no-store', // Always use for dynamic data
});

// Frontend API route
export async function GET() {
  const { token, apiBase } = await getSupabaseToken();
  const res = await fetch(`${apiBase}/pools/org/${orgId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
```

### 2. POST/PATCH Requests with Body

```typescript
// Frontend component
const response = await fetch(`/api/organizations/${orgId}/members/${memberId}/permissions`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates),
  cache: 'no-store',
});

// Frontend API route
export async function PATCH(request: Request) {
  const { token, apiBase } = await getSupabaseToken();
  const body = await request.json();

  const res = await fetch(`${apiBase}/organizations/${orgId}/members/${memberId}/permissions`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
```

## Environment Variables

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3333

# Production
NEXT_PUBLIC_API_URL=https://api.sssync.app
```

## API Route Structure

```
apps/app/app/api/
├── billing/           # Existing billing routes
│   ├── summary/route.ts
│   └── _utils.ts      # Shared utilities
├── organizations/     # Organization management
│   └── [orgId]/
│       ├── schema/route.ts
│       └── members/
│           └── [memberId]/
│               └── permissions/route.ts
└── pools/            # Pool management
    └── org/
        └── [orgId]/route.ts
```

## Error Handling

```typescript
// Frontend component
try {
  const res = await fetch('/api/organizations/schema', { cache: 'no-store' });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Request failed');
  }

  const data = await res.json();
  // Handle success
} catch (error) {
  console.error('API request failed:', error);
  // Handle error (show toast, etc.)
}
```

## Testing API Routes

Use the existing pattern:

```bash
# Start frontend dev server
npm run dev

# Test API route directly
curl -X GET http://localhost:3000/api/organizations/your-org-id/schema
```

The API route will automatically handle authentication through your browser session.

## Migration from Direct Backend Calls

If you have existing code making direct backend calls:

1. **Create frontend API route** in `apps/app/app/api/`
2. **Move backend URL logic** to the frontend route
3. **Update component** to call `/api/` instead of direct backend
4. **Remove manual token handling** from component
5. **Add proper error handling** in both places

## Key Benefits

- ✅ **Security**: No tokens exposed to frontend
- ✅ **Consistency**: All auth handled the same way
- ✅ **Maintainable**: Auth logic centralized
- ✅ **Debuggable**: Clear separation of concerns
- ✅ **CORS-safe**: No cross-origin issues

## Summary

**Frontend → Frontend API Route → Backend**

Never: **Frontend → Backend** (will fail with auth/CORS issues)

Always use the `/api/` prefix for frontend API calls!
