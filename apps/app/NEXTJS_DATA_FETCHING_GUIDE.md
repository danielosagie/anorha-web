# Next.js Data Fetching Mental Model Guide

## The Big Picture

In Next.js, there are **three layers** where data flows:

```
Frontend Component → Next.js API Route → Backend (NestJS)
     (Browser)          (Next.js Server)      (NestJS Server)
```

## Layer 1: Frontend Components (Your React Code)

**Location:** `app/(authenticated)/**/*.tsx`

**What you do here:**
- Fetch data from Next.js API routes (NOT directly from backend)
- Use `fetch()` with `/api/` prefix
- Handle loading states, errors, and success states
- Display the data in your UI

### Example: Fetching Pools

```typescript
// In your component
const [pools, setPools] = useState<Pool[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function loadPools() {
    try {
      setLoading(true);
      // ✅ CORRECT: Call Next.js API route
      const response = await fetch(`/api/pools/org/${orgId}`, {
        cache: 'no-store', // Always use this for dynamic data
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }
      
      const data = await response.json();
      setPools(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  loadPools();
}, [orgId]);

// Render
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
return <div>{pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}</div>;
```

### Key Rules for Frontend Components:

1. **Always use `/api/` prefix** - Never call backend directly
2. **Use `cache: 'no-store'`** - For dynamic data that changes
3. **Handle errors** - Always wrap in try/catch
4. **Show loading states** - Better UX
5. **No auth tokens** - Next.js API routes handle this automatically

---

## Layer 2: Next.js API Routes (The Bridge)

**Location:** `app/api/**/route.ts`

**What happens here:**
- Receives request from frontend
- Gets Clerk token from session
- Exchanges Clerk token for Supabase token
- Forwards request to backend with auth
- Returns backend response to frontend

### Example: Pool API Route

```typescript
// app/api/pools/org/[orgId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    
    // 1. Get Supabase token (handles Clerk → Supabase exchange)
    const { token, apiBase } = await getSupabaseToken();
    
    // 2. Forward to backend
    const res = await fetch(`${apiBase}/pools/org/${orgId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    // 3. Handle errors
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch pools' },
        { status: res.status }
      );
    }
    
    // 4. Return data
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Key Rules for API Routes:

1. **Always use `getSupabaseToken()`** - Handles auth automatically
2. **Forward to backend** - Use `apiBase` from environment
3. **Handle errors** - Return proper error responses
4. **Export HTTP methods** - `GET`, `POST`, `PATCH`, `DELETE`, etc.
5. **Use `dynamic = 'force-dynamic'`** - For routes that need fresh data

---

## Layer 3: Backend (NestJS)

**Location:** `sssync-bknd/src/**/*.controller.ts`

**What happens here:**
- Receives authenticated request from Next.js API route
- Validates Supabase JWT token
- Processes business logic
- Queries database
- Returns data

### Example: Backend Controller

```typescript
// sssync-bknd/src/pools/pools.controller.ts
@Controller('pools')
@UseGuards(SupabaseAuthGuard) // Validates JWT token
export class PoolsController {
  @Get('org/:orgId')
  async getPoolsByOrg(
    @Param('orgId') orgId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<Pool[]> {
    const userId = req.user.id; // From validated JWT
    return this.poolsService.getPoolsByOrg(userId, orgId);
  }
}
```

---

## Data Flow: Complete Example

### Scenario: Display user's pools on team page

#### Step 1: Component fetches data

```typescript
// app/(authenticated)/teams/[orgId]/page.tsx
const pools = await fetch(`/api/pools/org/${orgId}`, {
  cache: 'no-store'
}).then(res => res.json());
```

#### Step 2: Next.js API route handles auth

```typescript
// app/api/pools/org/[orgId]/route.ts
const { token, apiBase } = await getSupabaseToken();
const res = await fetch(`${apiBase}/pools/org/${orgId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Step 3: Backend processes request

```typescript
// sssync-bknd/src/pools/pools.controller.ts
@Get('org/:orgId')
async getPoolsByOrg(@Param('orgId') orgId: string) {
  return this.poolsService.getPoolsByOrg(orgId);
}
```

#### Step 4: Data flows back

```
Backend → Next.js API Route → Frontend Component → UI
```

---

## Common Patterns

### Pattern 1: GET Request (Read Data)

```typescript
// Frontend
const data = await fetch('/api/resource', { cache: 'no-store' })
  .then(res => res.json());

// API Route
export async function GET() {
  const { token, apiBase } = await getSupabaseToken();
  const res = await fetch(`${apiBase}/resource`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return NextResponse.json(await res.json());
}
```

### Pattern 2: POST Request (Create Data)

```typescript
// Frontend
const response = await fetch('/api/resource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Resource' }),
  cache: 'no-store',
});

// API Route
export async function POST(request: Request) {
  const { token, apiBase } = await getSupabaseToken();
  const body = await request.json();
  const res = await fetch(`${apiBase}/resource`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
```

### Pattern 3: PATCH Request (Update Data)

```typescript
// Frontend
const response = await fetch(`/api/resource/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Name' }),
  cache: 'no-store',
});

// API Route
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { token, apiBase } = await getSupabaseToken();
  const body = await request.json();
  const res = await fetch(`${apiBase}/resource/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
```

### Pattern 4: DELETE Request (Delete Data)

```typescript
// Frontend
const response = await fetch(`/api/resource/${id}`, {
  method: 'DELETE',
  cache: 'no-store',
});

// API Route
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { token, apiBase } = await getSupabaseToken();
  const res = await fetch(`${apiBase}/resource/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return NextResponse.json(await res.json());
}
```

---

## State Management: When to Use What

### Use React State for:
- ✅ UI state (modals, forms, toggles)
- ✅ Client-side data that changes frequently
- ✅ Data that doesn't need to persist

```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '' });
```

### Use Server Components for:
- ✅ Initial data loading
- ✅ Data that doesn't change often
- ✅ SEO-important content

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetch('...'); // Runs on server
  return <div>{data}</div>;
}
```

### Use API Routes + Client Components for:
- ✅ Data that needs auth
- ✅ Data that changes based on user actions
- ✅ Real-time updates

```typescript
// Client Component
'use client';
export function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);
  return <div>{data}</div>;
}
```

---

## Error Handling

### In Frontend Components

```typescript
try {
  const response = await fetch('/api/resource', { cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  const data = await response.json();
  // Use data
} catch (error) {
  // Show error to user
  console.error('Error:', error);
  toast.error(error.message);
}
```

### In API Routes

```typescript
export async function GET() {
  try {
    const { token, apiBase } = await getSupabaseToken();
    const res = await fetch(`${apiBase}/resource`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.message || 'Backend error' },
        { status: res.status }
      );
    }
    
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333  # Development
NEXT_PUBLIC_API_URL=https://api.sssync.app # Production
```

### Backend

Uses Supabase for database and auth. No direct frontend access needed.

---

## Quick Reference

### ✅ DO:

- Call `/api/` routes from frontend
- Use `cache: 'no-store'` for dynamic data
- Handle errors properly
- Use `getSupabaseToken()` in API routes
- Forward requests to backend with auth headers

### ❌ DON'T:

- Call backend directly from frontend
- Hardcode backend URLs in components
- Skip error handling
- Forget to add auth headers in API routes
- Use `cache: 'default'` for user-specific data

---

## Mental Model Summary

1. **Frontend Component** = "I need data"
2. **Next.js API Route** = "Let me get that for you (with auth)"
3. **Backend** = "Here's the data (validated and processed)"

**Remember:** Frontend → API Route → Backend. Never skip the middle layer!

---

## Need Help?

- Check existing API routes in `app/api/` for examples
- Look at `API_REQUESTS_GUIDE.md` for more details
- Check backend controllers in `sssync-bknd/src/` to see what endpoints exist
- Run `npm run docs:generate` to see all available endpoints



