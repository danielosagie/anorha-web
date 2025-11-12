# How to Call and Store Data: Step-by-Step Walkthrough

## Your Question: "I don't get how to call the information/store it"

This answers: **Where does data come from? How do I fetch it? Where does it live? How do I display it?**

---

## Scenario 1: Display User's Current Pools on Team Page

### Step 1: **Call (Fetch) the Data**

```tsx
// In loadData() function:
const clerkToken = await getToken();  // Get auth token from Clerk

const poolsRes = await fetch(
  `${API_BASE}/api/pools/org/${orgId}`,  // Endpoint on NestJS backend
  {
    headers: {
      'Authorization': `Bearer ${clerkToken}`,  // Auth header
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  }
);

const poolsData = await poolsRes.json();  // Parse response: Array<Pool>
```

**What Happens:**
1. Get Clerk token (`clerkToken`) — proves user is logged in
2. Send GET request to backend endpoint
3. Backend validates token, looks up pools for that org
4. Returns: `[{ id: '...', name: 'Main Store', sync_inventory: true, ... }, ...]`

---

### Step 2: **Store (Save) the Data**

```tsx
// Still in loadData():
setPools(Array.isArray(poolsData) ? poolsData : []);
```

**What Happens:**
1. React state updates: `pools = poolsData`
2. Component re-renders with new data
3. UI can now access pools in state

---

### Step 3: **Display the Data**

```tsx
// In render section:
{pools.map((pool) => (
  <PoolCard key={pool.id}>
    <h3>{pool.name}</h3>
    <p>Sync Inventory: {pool.sync_inventory ? 'On' : 'Off'}</p>
  </PoolCard>
))}
```

**What Happens:**
1. Loop through `pools` array (from state)
2. For each pool, render a card
3. Display pool name, settings, etc.

---

**Full Data Journey:**
```
Backend DB 
  ↓ (has pool records)
Backend API Endpoint 
  ↓ (validates auth, filters by org)
Your Fetch Call 
  ↓ (sends request with Clerk token)
Response JSON 
  ↓ (array of pools)
setPools(poolsData) 
  ↓ (stores in React state)
pools state variable 
  ↓ (available everywhere in component)
{pools.map(...)} 
  ↓ (renders in UI)
User sees pool list on screen ✅
```

---

## Scenario 2: User Changes Pool Permissions (Edit)

### Step 1: **Capture User Input**

```tsx
// User clicks "Edit" button:
<Button onClick={() => setEditingPool(pool)}>
  Edit
</Button>

// Now editingPool state has:
// { id: 'pool-1', name: 'Main Store', description: '...', sync_inventory: true, ... }
```

**What Happens:**
1. User clicks edit
2. Form appears with pre-filled values from `pool` object
3. `editingPool` state holds current form data

---

### Step 2: **Listen for Form Changes**

```tsx
// User types in input:
<Input
  value={editingPool.name}
  onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
/>
```

**What Happens:**
1. User changes text
2. `onChange` fires
3. `editingPool.name` updates in state
4. Input re-renders with new value
5. Component ready to save (but hasn't sent to backend yet)

---

### Step 3: **Send Update to Backend**

```tsx
// User clicks "Update" button:
<Button onClick={() => updatePool(pool.id, editingPool)}>
  Update
</Button>

// updatePool function:
const updatePool = async (poolId, updates) => {
  const clerkToken = await getToken();
  
  const res = await fetch(
    `${API_BASE}/api/pools/${poolId}`,  // Update specific pool by ID
    {
      method: 'PATCH',  // Update (not Create)
      headers: {
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)  // Send updated fields
    }
  );
  
  const updatedPool = await res.json();  // Get back updated pool
  return updatedPool;
}
```

**What Happens:**
1. Call updatePool with pool ID + edited data
2. Clerk token sent to prove user owns this pool
3. Backend validates, updates DB
4. Returns updated pool record

---

### Step 4: **Update State with New Data**

```tsx
// After backend responds:
const updatedPool = await res.json();

// Option A: Update specific item in array (optimistic update)
setPools(prev => prev.map(
  p => p.id === poolId ? updatedPool : p
));

// Option B: Reload everything (safest)
await loadData();
```

**What Happens:**
- Option A: Immediately show updated pool in UI (faster, but assumes success)
- Option B: Fetch all data from backend again (slower, but always correct)

---

**Full Data Journey for Edit:**
```
User types in form 
  ↓
editingPool state updates (local)
  ↓ (not saved yet)
User clicks "Update" 
  ↓
Send PATCH request with Clerk token + new data
  ↓
Backend validates & updates DB 
  ↓
Response: { updated pool record }
  ↓
setPools(prev => ...) or loadData()
  ↓
pools state updates
  ↓
UI re-renders with new data ✅
Dialog closes, user sees updated pool list
```

---

## Scenario 3: Store Member's New Role Assignment

### Step 1: **User Selects New Role**

```tsx
<Select
  value={memberPerms?.role}
  onValueChange={(value) => {
    updateMemberPermissions(memberId, { role: value })
  }}
>
  <SelectItem value="org:admin">Admin</SelectItem>
  <SelectItem value="org:member">Member</SelectItem>
</Select>
```

**What Happens:**
1. User picks "Admin" from dropdown
2. `onValueChange` fires immediately
3. Call `updateMemberPermissions` with new role

---

### Step 2: **Call Backend to Save**

```tsx
const updateMemberPermissions = async (memberId, updates) => {
  const clerkToken = await getToken();
  
  const res = await fetch(
    `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)  // { role: 'org:admin' }
    }
  );
  
  const permData = await res.json();
  
  // Refresh all data:
  await loadData();
}
```

**What Happens:**
1. Call endpoint specific to this member
2. Send `{ role: 'org:admin' }`
3. Backend updates OrgMemberships table
4. Load fresh data

---

### Step 3: **Display Updated Permission**

```tsx
// After loadData() refreshes:
// permissions state now has: { [memberId]: { role: 'org:admin', ... } }

// In render:
<Select value={memberPerms?.role}>  {/* Shows 'org:admin' now */}
```

**What Happens:**
1. permissions state updates from backend response
2. Select control re-renders
3. User sees their new role selected ✅

---

**Full Data Journey for Member Update:**
```
DB (OrgMemberships) 
  ↓ (has member records with roles)
Backend API endpoint 
  ↓ (validates user can edit)
Your PATCH request 
  ↓ (sends Clerk token + new role)
Backend updates DB 
  ↓
loadData() refetches permissions 
  ↓
setPerm issions(permissionsMap)
  ↓
UI re-renders member card
  ↓
Dropdown shows new role ✅
```

---

## The Formula (Always Use This)

### **To GET Data:**
```tsx
// 1. Call (fetch)
const token = await getToken();
const res = await fetch(ENDPOINT, { headers: { Authorization: token } });
const data = await res.json();

// 2. Store
setState(data);

// 3. Display
{state.map(item => <div>{item}</div>)}
```

### **To UPDATE Data:**
```tsx
// 1. Capture user input
// setEditingState(value)

// 2. Call (fetch with PATCH/POST)
const token = await getToken();
const res = await fetch(ENDPOINT, {
  method: 'PATCH',
  body: JSON.stringify(editingState)
});

// 3. Store (refresh)
setOriginalState(await res.json()); // or loadData()
```

---

## Real Code Example from Your Component

### Getting Pools:
```tsx
// CALL: Fetch pools
const poolsRes = await fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers });
const poolsData = await poolsRes.json();

// STORE: Save to state
setPools(Array.isArray(poolsData) ? poolsData : []);

// DISPLAY: Show in UI
{pools.map((pool) => (
  <div key={pool.id}>{pool.name}</div>
))}
```

### Updating Member Role:
```tsx
// CAPTURE: User picks new role
onValueChange={(value) => updateMemberPermissions(memberId, { role: value })}

// CALL: Send to backend
const res = await fetch(
  `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
  {
    method: 'PATCH',
    body: JSON.stringify({ role: value })
  }
);

// STORE: Refresh permissions
await loadData();  // Refetch everything

// DISPLAY: Already displayed, re-renders automatically
{memberPerms?.role}  // Shows new role
```

---

## Debugging: If Data Doesn't Show

1. **Check CALL:** Does console log show API response? `console.log('poolsData:', poolsData)` in loadData()
2. **Check STORE:** Does state update? Check React DevTools → Component → State
3. **Check DISPLAY:** Is the template correct? `{pools.map(...)}` or `{pools[0]?.name}`?

**Example Debug:**
```tsx
// Add to loadData():
console.log('✅ Fetched pools:', poolsData);  // See API response
console.log('✅ About to store in state');
setPools(poolsData);

// In render:
console.log('📊 Current pools state:', pools);  // See what component has
{pools.length === 0 ? <p>No pools</p> : pools.map(...)}  // Fallback if empty
```

---

## Key Takeaway

**Call → Store → Display**

Every piece of data follows this path. When something doesn't work, check which step broke:
- Data not on screen? → Problem in DISPLAY
- Data wrong? → Problem in CALL or STORE
- Data old? → Need to re-CALL/STORE




