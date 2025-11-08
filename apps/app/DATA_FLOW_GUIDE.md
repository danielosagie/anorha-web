# Data Flow & Storage Guide for MemberPermissionsPage

## Problem You Had
"I don't know how to call the information/store it"—The component fetches data but doesn't clearly show how it flows through state, when it updates, or where to access it.

---

## The Clean Architecture (How It Works)

### 1. **Initial Load: Component Mounts → Organization Available**

```
useEffect([isLoaded, orgId]) 
  ↓
  Check: Is org loaded + org selected?
  ↓
  YES → Call loadData()
  NO → Wait (logs "Waiting for organization...")
```

**State:** `loading = true` (spinner shows)

---

### 2. **Data Fetching: loadData() Function**

**What it does:** Fetches 3 independent data sources in parallel, stores in state.

```
loadData()
  ├─ Fetch 1: Pools (for current org)
  │   ├─ URL: /api/pools/org/{orgId}
  │   ├─ Headers: Authorization: Bearer ${clerkToken}
  │   ├─ Response: Array<Pool>
  │   └─ Store in: setPools() → `pools` state
  │
  ├─ Fetch 2: Org Schema (tier, features, limits)
  │   ├─ URL: /api/organizations/{orgId}/schema
  │   ├─ Response: OrgSchema { tier, features, limits }
  │   └─ Store in: setSchema() → `schema` state
  │
  └─ Fetch 3: Members & Permissions (from Clerk + backend)
      ├─ Get members from Clerk: organization.getMemberships()
      ├─ For each member:
      │   ├─ URL: /api/organizations/{orgId}/members/{memberId}/permissions
      │   ├─ Response: MemberPermissions { role, assignedPoolIds, poolPermissions, ... }
      │   └─ Collect in: permissionsMap
      └─ Store in: setPermissions() → `permissions` state
```

**State After Load:**
- `pools: Pool[]` — All location pools for the org
- `schema: OrgSchema` — Org tier/feature info
- `permissions: Record<memberId, MemberPermissions>` — All member permissions keyed by Clerk member ID
- `members: any[]` — Clerk members
- `loading: false` — Done loading, UI renders

**Error Handling:** If any fetch fails, logs error + toast, but tries others (graceful)

---

### 3. **How Data is Displayed in UI**

#### **Pools List (Top Section)**
```tsx
{pools.map((pool) => (
  <PoolCard key={pool.id}>
    Name: {pool.name}
    Description: {pool.description}
    Sync: Inventory={pool.sync_inventory}, Pricing={pool.sync_pricing}
    Actions: Edit, Delete
  </PoolCard>
))}
```

**Data Source:** `pools` state (Array)  
**Flow:** Pool object → Display fields + Edit/Delete handlers  
**Edit Handler:** Click "Edit" → `setEditingPool(pool)` → Dialog shows with filled inputs  

---

#### **Members & Permissions (Bottom Section)**
```tsx
{members.map((member) => {
  const memberPerms = permissions[member.publicUserData.userId];
  return (
    <MemberCard key={memberId}>
      Name: {member.firstName} {member.lastName}
      Email: {member.identifier}
      Role (Dropdown): {memberPerms.role}
      Pools (Checkboxes):
        - [✓] Pool A (canRead, canEdit, canSync)
        - [✓] Pool B (canRead, canEdit, canSync)
    </MemberCard>
  )
})}
```

**Data Sources:**
- `members` state (from Clerk) → Display name/email
- `permissions[memberId]` state → Display role, assigned pools, pool permissions
- `pools` state → List of pools to show as checkboxes

**Flow:** 
1. Clerk member → Extract `memberId`
2. Look up `permissions[memberId]` → Get their settings
3. For each pool, check if in `assignedPoolIds` + get `poolPermissions[poolId]`
4. Render checkboxes with current state

---

### 4. **State Updates: User Actions**

#### **A. Update Member Role**
```
User selects new role in dropdown
  ↓
updateMemberPermissions(memberId, { role: "org:admin" })
  ↓
  Fetch: PATCH /api/organizations/{orgId}/members/{memberId}/permissions
  Body: { role: "org:admin" }
  ↓
  Backend updates DB
  ↓
  Component calls loadData() again
  ↓
  permissions state refreshed
  ↓
  UI re-renders with new role
```

**State Changed:** `permissions[memberId].role`

---

#### **B. Assign Pool to Member**
```
User checks a pool checkbox
  ↓
onCheckedChange triggers
  ↓
const newPoolIds = [...currentPools, poolId]  // Add to assigned list
  ↓
updateMemberPermissions(memberId, { assignedPoolIds: newPoolIds })
  ↓
  Fetch: PATCH /api/organizations/{orgId}/members/{memberId}/permissions
  Body: { assignedPoolIds: [pool1, pool2] }
  ↓
  Backend updates DB
  ↓
  Component calls loadData()
  ↓
  permissions state refreshed
  ↓
  UI shows checkbox checked, pool permissions sub-controls appear
```

**State Changed:** `permissions[memberId].assignedPoolIds`

---

#### **C. Create New Pool**
```
User clicks "Create Pool" button
  ↓
Dialog opens, form rendered
  ↓
User fills: name, description, sync_inventory, sync_pricing
  ↓
setEditingPool({ id: 'new', name: '...', ...})  // Local edit state
  ↓
User clicks "Create" button
  ↓
Fetch: POST /api/pools
Body: { orgId, name, description, syncInventory, syncPricing }
  ↓
  Backend creates pool in DB
  ↓
  Component updates UI: setPools([...pools, newPool])  // Optimistic update
  ↓
  OR calls loadData() to refresh all
  ↓
  pools state includes new pool
  ↓
  UI now shows new pool in list
```

**State Changed:** `pools` array + `editingPool` cleared

---

#### **D. Edit Pool**
```
User clicks "Edit" on a pool
  ↓
setEditingPool(poolData)  // Store current pool data in `editingPool` state
  ↓
Dialog opens with inputs pre-filled from `editingPool`
  ↓
User modifies fields
  ↓
setEditingPool({ ...editingPool, name: newName })  // Update local state
  ↓
User clicks "Update" button
  ↓
Fetch: PATCH /api/pools/{poolId}
Body: { name, description, sync_inventory, sync_pricing }
  ↓
  Backend updates DB
  ↓
  Component updates UI: setPools(prev => prev.map(p => p.id === poolId ? updated : p))
  ↓
  pools state reflects change
  ↓
  UI shows updated pool
```

**State Changed:** `pools` array item + `editingPool` cleared

---

### 5. **State Overview (All Together)**

```tsx
// SINGLE TRUTH SOURCES (Single Source of Truth for Each Concept)

pools: Pool[]
  ├─ Source: Backend (/api/pools/org/{orgId})
  ├─ Updated when: loadData() called OR user creates/edits/deletes pool
  ├─ Displayed in: Pools list section
  └─ Used for: Rendering pool cards + checkbox list for members

members: any[]
  ├─ Source: Clerk organization.getMemberships()
  ├─ Updated when: loadData() called
  ├─ Displayed in: Members card titles + role dropdown
  └─ Used for: Iterating to display each member

permissions: Record<memberId, MemberPermissions>
  ├─ Source: Backend (/api/organizations/{orgId}/members/{memberId}/permissions)
  ├─ Updated when: loadData() called OR user changes role/pools
  ├─ Displayed in: Member role selector, pool assignments, permissions checks
  └─ Used for: Displaying current user settings

schema: OrgSchema
  ├─ Source: Backend (/api/organizations/{orgId}/schema)
  ├─ Updated when: loadData() called
  ├─ Displayed in: "Current tier: X" info text
  └─ Used for: Showing org tier/limits info

editingPool: EditingPool | null
  ├─ Source: User input (form fields)
  ├─ Updated when: User edits pool create/edit dialog
  ├─ Displayed in: Dialog form inputs
  └─ Used for: Temporary form state during create/edit

loading, saving, error: boolean | string
  ├─ Source: Async operation states
  ├─ Updated when: Fetch starts/ends
  ├─ Displayed in: Loading spinners, error messages, disabled button states
  └─ Used for: UX feedback

// REMEMBER: When you see data in UI, trace back to ONE of these state variables.
```

---

## Common Patterns (How to Access Data)

### **Pattern 1: Display User's Current Role**
```tsx
const memberId = member.publicUserData.userId;
const memberPerms = permissions[memberId];
const currentRole = memberPerms?.role || 'unknown';

// Display: {currentRole}
```

**Data Path:** `permissions[memberId].role`

---

### **Pattern 2: Check if Member Has Access to a Pool**
```tsx
const memberId = member.publicUserData.userId;
const memberPerms = permissions[memberId];
const isAssigned = memberPerms?.assignedPoolIds?.includes(pool.id) || false;

// Display checkbox: checked={isAssigned}
```

**Data Path:** `permissions[memberId].assignedPoolIds.includes(pool.id)`

---

### **Pattern 3: Get Member's Permissions for a Specific Pool**
```tsx
const memberId = member.publicUserData.userId;
const memberPerms = permissions[memberId];
const poolPerms = memberPerms?.poolPermissions?.[pool.id] || {
  canRead: true,
  canEdit: false,
  canSync: false,
};

// Display: canRead={poolPerms.canRead}, canEdit={poolPerms.canEdit}, etc.
```

**Data Path:** `permissions[memberId].poolPermissions[poolId]`

---

## Quick Checklist: Storing New Data

1. **Need to fetch data from backend?**
   - Add `const [newData, setNewData] = useState(...)`
   - Fetch in `loadData()` function
   - Set with `setNewData(response)`

2. **Need to update UI on user input?**
   - Create handler: `const handleUpdate = async () => { ... updateMemberPermissions(...) ... }`
   - After update succeeds, call `loadData()` to refresh OR update state directly with optimistic update
   - Example: `setPools(prev => prev.map(p => p.id === id ? {...p, updated} : p))`

3. **Need to display data?**
   - Find it in the state variables above
   - Access with correct path (e.g., `permissions[memberId].role`)
   - Render with fallback (e.g., `memberPerms?.role || 'member'`)

---

## Why This Matters

**Before (Confusing):** Data scattered, unclear when/where updated, hard to debug.  
**After (Clear):** Each state = one concept. Trace data path: UI → Handler → API → State → UI.

**For Interviews:** "Data flows from backend into state, gets displayed in UI, user changes trigger updates back to backend, state refreshes, UI re-renders."

