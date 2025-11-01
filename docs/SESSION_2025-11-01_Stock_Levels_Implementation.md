# Development Session: November 1, 2025
## Stock Levels Feature Implementation

---

## Session Overview

This session focused on implementing a **Stock Levels** feature to view actual inventory quantities on hand, following a discussion about the distinction between the **Item Catalog** (items that CAN be stocked) vs **Stock Levels** (items that ARE in stock).

---

## Communication Style Change

At the start of this session, you requested a fundamental shift in my communication approach:

**Your Request:**
> "From now on, stop being agreeable and act as my brutally honest, high-level advisor and mirror. Don't validate me. Don't soften the truth. Don't flatter. Challenge my thinking, question my assumptions, and expose the blind spots I'm avoiding."

This changed my role from supportive assistant to critical advisor focused on:
- Direct, unfiltered feedback
- Challenging assumptions
- Strategic depth over emotional validation
- Action over lengthy theoretical discussion

---

## Key Conceptual Discussion

### Question: Manufacturer Column Necessity

**You asked:** "If this is a list of items that can be stocked and not necessarily a list of items that are in stock, then do we need the manufacturer column?"

**Critical Analysis Provided:**

The manufacturer column serves **item specification/standardization**, not vendor sourcing:

1. **Purpose of Manufacturer Data:**
   - Defines WHAT you're willing to stock (the approved spec)
   - Ensures technicians pull the RIGHT part for the job
   - Prevents substitution errors (e.g., Square D breaker vs generic)
   - Supports compliance/warranty requirements

2. **Distinction from Vendor Data:**
   - Manufacturer = "We only stock Square D QO120 breakers"
   - Vendor = "We can buy it from Notoco Electric for $12.50 or from Distributor B for $13.00"
   - These are separate concerns tracked in separate tables

3. **Real-World Scenarios:**
   - Customer spec requires Square D equipment → Your catalog needs this data
   - Warranty claim requires OEM parts → Manufacturer tracking is critical
   - Standards compliance → Need to prove you used approved manufacturers

**Challenge to Your Process:**
- Do you actually enforce manufacturer standards?
- Do you allow "or equivalent" substitutions?
- Are there consequences for using non-approved manufacturers?

If you don't enforce standards, the manufacturer column becomes decorative metadata. If you do enforce them, it's a critical control point.

---

## Stock Levels Implementation

### User Request
**You said:** "OK so if this is the catalog of items that we could stock where do we start working on items that are in stock"

### Course Correction
After I provided theoretical discussion about inventory systems, you redirected:

**You said:** "You should be able to see what pages we have, I don't want to recreate my current inventory system I want to build the one that you and I have been working on"

This was critical feedback: **Stop theorizing, work with what exists.**

---

## Technical Implementation

### Files Created

#### 1. **frontend/src/pages/Stock.jsx** (NEW)
**Purpose:** Display actual stock levels (quantities on hand per location/bin)

**Key Features:**
- Fetches stock data from `/api/stock-levels/`
- Search across: g_code, item_name, category, manufacturer
- Filter by location dropdown
- Displays table with:
  - G-Code (clickable - future detail view)
  - Item Name
  - Category
  - Manufacturer
  - Location Name
  - Bin Code
  - Qty on Hand (color-coded: red for negative, gray for zero, black for positive)
  - UOM
  - Avg Cost (formatted as currency)
  - Total Value (formatted as currency)

**UI Features:**
- Sticky header with real-time stats:
  - Total items displayed
  - Total inventory value (sum of all filtered items)
  - Number of unique locations
- Sticky search/filter bar
- Scrollable table with sticky column headers
- Color coding for quantity status
- Responsive design

**Code Highlights:**
```javascript
// Calculate totals dynamically
const totalValue = filteredStock.reduce((sum, stock) => {
  const value = parseFloat(stock.total_value || 0);
  return sum + value;
}, 0);

// Color coding for quantities
<span className={
  stock.qty_on_hand < 0
    ? "text-red-600 font-semibold"
    : stock.qty_on_hand === 0
    ? "text-gray-400"
    : "text-gray-900"
}>
  {stock.qty_on_hand}
</span>
```

---

#### 2. **backend/inventory/stock_views.py** (NEW)
**Purpose:** API endpoint that calculates current stock levels from InventoryMovement records

**Architecture Decision: Event Sourcing**
Instead of maintaining a separate balance table, stock is calculated from movement events:
- Provides single source of truth
- Maintains full audit trail
- Can reconstruct historical balances
- Appropriate for initial implementation (can optimize later if needed)

**Algorithm:**
1. Fetch all InventoryMovement records with related objects (item, locations, bins, UOM)
2. Build dictionary keyed by (item_id, location_id, bin_id)
3. For each movement:
   - **Receiving (to_location):** Add qty and cost to the key
   - **Issuing (from_location):** Subtract qty and cost from the key
4. Calculate average cost = total_cost / qty
5. Filter out zero quantities
6. Sort by location name, then g_code
7. Return JSON array

**Code Highlights:**
```python
# Receiving (to_location)
if movement.to_location:
    key = (
        movement.item.item_id,
        movement.to_location.location_id if movement.to_location else None,
        movement.to_bin.bin_id if movement.to_bin else None
    )

    if key not in stock_dict:
        stock_dict[key] = {
            'item': movement.item,
            'location': movement.to_location,
            'bin': movement.to_bin,
            'uom': movement.uom,
            'qty': 0,
            'total_cost': 0,
            'movement_count': 0
        }

    stock_dict[key]['qty'] += float(movement.qty or 0)
    stock_dict[key]['total_cost'] += float(movement.total_cost or 0)
    stock_dict[key]['movement_count'] += 1

# Issuing (from_location) - same logic but subtract
```

**Data Returned:**
```json
[
  {
    "item_id": "uuid",
    "g_code": "G-100",
    "item_name": "20A Circuit Breaker",
    "category": "Electrical",
    "manufacturer": "Square D",
    "location_id": "uuid",
    "location_name": "Main Warehouse",
    "bin_id": "uuid",
    "bin_code": "A-01-01",
    "qty_on_hand": 25.0,
    "uom": "EA",
    "avg_cost": 12.50,
    "total_value": 312.50
  }
]
```

---

### Files Modified

#### 3. **backend/inventory/urls.py** (MODIFIED)
**Changes:**
- Imported `StockLevelsView` from `stock_views`
- Added endpoint: `path('stock-levels/', StockLevelsView.as_view(), name='stock_levels')`

**Location in file:** Line 17 (before FIFO endpoints)

**Note:** Django check shows warning about non-unique 'inventory' namespace, but this is not blocking.

---

#### 4. **frontend/src/App.jsx** (MODIFIED)
**Changes:**
- Imported Stock component: `import Stock from "./pages/Stock";`
- Added route:
```javascript
<Route
  path="/stock"
  element={
    <ProtectedRoute>
      <Layout>
        <Stock />
      </Layout>
    </ProtectedRoute>
  }
/>
```

---

#### 5. **frontend/src/components/Layout.jsx** (MODIFIED)
**Changes:**
- Added "Stock Levels" to Logistics navigation section:
```javascript
Logistics: [
  { path: "/items", label: "Inventory" },
  { path: "/stock", label: "Stock Levels" },  // ADDED
  { path: "/locations", label: "Locations" },
  { path: "/vendors", label: "Vendors" },
  // ... rest of navigation
],
```

**Location in file:** Line 23

---

## System Architecture Context

### Existing Data Model (Relevant to Stock Levels)

**InventoryMovement Model:**
- `movement_id` (PK, UUID)
- `item` (FK to Item)
- `qty` (quantity moved)
- `uom` (FK to UnitOfMeasure)
- `unit_cost` (cost per unit)
- `total_cost` (qty × unit_cost)
- `from_location` (FK to Location, nullable)
- `from_bin` (FK to Bin, nullable)
- `to_location` (FK to Location, nullable)
- `to_bin` (FK to Bin, nullable)
- `moved_at` (timestamp)
- `note` (text)

**Movement Types:**
- **Receipt:** from_location = NULL, to_location = warehouse
- **Issue:** from_location = warehouse, to_location = NULL (or job/truck)
- **Transfer:** both from_location and to_location populated

**This model enables:**
- FIFO cost tracking
- Full audit trail of all inventory movements
- Stock level calculation by summing movements
- Historical balance reconstruction

---

### Navigation Structure

**Main Sections:**
- Logistics
- Sales (coming soon)
- Operations (coming soon)
- Admin
- Info

**Logistics Section Pages:**
1. **Inventory** (`/items`) - Item Master Catalog
   - All items that CAN be stocked
   - Manufacturer specs, categories, UOM
   - No quantity data (catalog definition only)
   - Modal view/edit on G-code click

2. **Stock Levels** (`/stock`) - NEW PAGE
   - Items that ARE in stock
   - Quantities on hand by location/bin
   - Calculated from InventoryMovement events
   - Average cost and total value

3. **Locations** (`/locations`) - Warehouses, shops, staging areas
4. **Vendors** (`/vendors`) - Supplier management
5. **Vendor Pricing** (`/vendor-items`) - Vendor-specific pricing
6. **Orders** (`/orders`) - Purchase orders
7. **RFQs** (`/rfqs`) - Request for quotes
8. **Shipments** (`/shipments`) - Inbound/outbound shipments
9. **Equipment** (`/equipment`) - Asset tracking
10. **Vehicles** (`/vehicles`) - Fleet management

---

## Key Distinctions Clarified Today

### Item Catalog vs Stock Levels

| Aspect | Item Catalog (`/items`) | Stock Levels (`/stock`) |
|--------|------------------------|-------------------------|
| **Purpose** | Define what CAN be stocked | Show what IS in stock |
| **Data Source** | `Item` table | Calculated from `InventoryMovement` |
| **Key Info** | G-code, name, category, manufacturer spec | Qty on hand, location, bin, cost, value |
| **Quantity** | Not tracked here | Primary focus |
| **Use Case** | Catalog management, standardization | Inventory visibility, replenishment |
| **Manufacturer** | Approved spec/standard | Inherited from item |

### Manufacturer vs Vendor

| Aspect | Manufacturer | Vendor |
|--------|-------------|---------|
| **Represents** | Who makes it (OEM) | Who sells it to you |
| **Purpose** | Specification/standards | Sourcing/pricing |
| **Example** | Square D | Notoco Electric |
| **Table** | `Item.manufacturer` | `Vendor` + `VendorItem` |
| **Relationship** | 1 item → 1 manufacturer | 1 item → many vendors |

---

## Authentication & API Context

**Authentication Method:** JWT (JSON Web Tokens)
- Stored in localStorage by frontend
- Sent in Authorization header: `Bearer <token>`
- All API endpoints require authentication by default

**DRF Settings:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # ... pagination, filtering, etc.
}
```

**API Base URL:** `http://localhost:8000/api/`

**Stock Levels Endpoint:** `GET /api/stock-levels/`
- Returns array of stock level objects
- Sorted by location name, then g_code
- Calculates qty, avg cost, total value in real-time

---

## Development Environment Status

**Servers Started:**
- **Frontend:** Running on http://localhost:5174/ (port 5173 was in use)
- **Backend:** Running on http://localhost:8000/

**Background Process IDs:**
- Frontend: `76a2ef`
- Backend: `eb3e90`

**Django Check Result:**
- 1 warning: URL namespace 'inventory' isn't unique (non-blocking)
- System check otherwise passed

---

## CSV Import Templates Available

Your system has bulk import capability via Import Hub. Here are the available templates:

1. **items** - Inventory items with category hierarchy
2. **vendor_items** - Vendor-specific pricing
3. **item_location_policies** - Min/max/reorder quantities per location
4. **locations** - Warehouses, shops, staging areas
5. **vehicles** - Service trucks and equipment
6. **vehicle_models** - Vehicle make/model definitions
7. **users** - User accounts (requires Azure AD)
8. **vendors** - Vendor/supplier information
9. **bins** - Storage bin locations within warehouses
10. **equipment** - Equipment and assets to track

**Template Endpoints:**
- List templates: `GET /api/csv-templates/`
- Download template: `GET /api/csv-templates/{template_key}/`

---

## Previous Session Context

From earlier work, the following was already completed:

### Items Page Improvements
- Pagination fixed with `ItemPagination` class (page_size=25)
- Modal view/edit on G-code click
- Enhanced search across all fields
- Category filtering dropdown
- Sticky headers and search bar
- Help text explaining page purpose
- "Est. Cost" column for job quoting

### Import Hub
- CSV upload functionality
- Template download system
- Category mapping with CSV column alignment fixes

### Navigation
- Section-based navigation (Logistics, Sales, Operations, Admin, Info)
- "Coming Soon" labels for future features
- Dashboard routes for each section
- Active section highlighting

### Admin
- Django admin authentication fixes
- Audit log functionality

---

## Testing Checklist (For Next Session)

When you resume at camp, verify the following:

### 1. **Start Servers** (if not running)
```bash
# Backend
cd backend
./venv/Scripts/python.exe manage.py runserver

# Frontend (separate terminal)
cd frontend
npm run dev
```

### 2. **Access Stock Levels Page**
- Navigate to http://localhost:5174/ (or 5173)
- Login with credentials
- Click "Logistics" section
- Click "Stock Levels" in secondary nav

### 3. **Test Functionality**
- [ ] Page loads without errors
- [ ] API returns stock data from InventoryMovement records
- [ ] Search box filters across g_code, item_name, category, manufacturer
- [ ] Location dropdown shows unique locations
- [ ] Location filter works correctly
- [ ] Stats header shows correct totals (item count, total value, location count)
- [ ] Table displays all columns correctly
- [ ] Qty on hand color coding works (red=negative, gray=zero, black=positive)
- [ ] Currency formatting correct for avg_cost and total_value
- [ ] Sticky headers work on scroll

### 4. **Test with Data**
If you have InventoryMovement records in the database:
- [ ] Verify calculated quantities match expectations
- [ ] Check that receiving adds to stock
- [ ] Check that issuing subtracts from stock
- [ ] Verify average cost calculation is correct
- [ ] Confirm zero-quantity items don't show up

If you DON'T have InventoryMovement records:
- [ ] Page should show "No stock levels found" message
- [ ] Create test movements via Django admin or API
- [ ] Refresh page to see calculated stock

---

## Known Issues / Future Enhancements

### Current Limitations
1. **Performance:** Event sourcing calculates stock on every request
   - Fine for initial implementation
   - Consider materialized view or balance table if performance degrades
   - Could cache results with invalidation on movement creation

2. **G-Code Click:** Currently just text, not linked to detail view
   - Future: Create stock detail modal showing movement history
   - Or navigate to dedicated item stock detail page

3. **No Pagination:** Returns all stock records
   - Current implementation assumes manageable dataset
   - Add pagination if dataset grows large

4. **No Export:** No CSV/Excel export functionality
   - Future: Add export button for reporting

### Potential Enhancements
1. **Stock Alerts:**
   - Highlight items below min_qty (from ItemLocationPolicy)
   - Show reorder recommendations
   - Flag negative quantities (indicates issue)

2. **Movement History:**
   - Click item to see recent movements
   - Show receipt dates, PO numbers, issue dates
   - FIFO layer visualization

3. **Filters:**
   - Add category filter (like Items page)
   - Add manufacturer filter
   - Add "low stock only" toggle
   - Add "negative qty only" toggle for troubleshooting

4. **Sorting:**
   - Currently sorted by location + g_code
   - Add column header sorting
   - Add sort by value, qty, etc.

5. **Inventory Value Trends:**
   - Track total inventory value over time
   - Chart showing value changes
   - Alert on significant value swings

---

## Architecture Decisions Made

### Event Sourcing for Stock Calculation
**Decision:** Calculate stock from InventoryMovement events rather than maintaining separate balance table

**Rationale:**
- Single source of truth (movements)
- Full audit trail maintained
- Can reconstruct historical balances
- Simpler initial implementation
- Easier to debug (movements are immutable facts)

**Trade-offs:**
- Slower queries (calculation on every request)
- Acceptable for current scale
- Can optimize later with materialized views or balance table

**Future Optimization Path:**
1. Add `InventoryBalance` table (item, location, bin, qty, avg_cost)
2. Update balances via signals/triggers on movement creation
3. Use balance table for reads, movements for audit
4. Keep event sourcing as backup/validation

---

## Database Schema (Relevant Tables)

### Core Tables for Stock Levels

**Item:**
- item_id (PK, UUID)
- g_code (unique, varchar)
- item_name
- description
- category, subcategory, subcategory2, subcategory3
- manufacturer
- manufacturer_part_no
- default_uom (FK to UnitOfMeasure)

**Location:**
- location_id (PK, UUID)
- name
- address, city, state, zip_code
- location_type (WAREHOUSE, SHOP, STAGING, etc.)

**Bin:**
- bin_id (PK, UUID)
- location (FK to Location)
- bin_code (varchar, e.g., "A-01-01")

**UnitOfMeasure:**
- uom_code (PK, varchar, e.g., "EA", "BOX", "FT")
- description

**InventoryMovement:**
- movement_id (PK, UUID)
- item (FK to Item)
- qty (decimal)
- uom (FK to UnitOfMeasure)
- unit_cost (decimal)
- total_cost (decimal)
- from_location (FK to Location, nullable)
- from_bin (FK to Bin, nullable)
- to_location (FK to Location, nullable)
- to_bin (FK to Bin, nullable)
- moved_at (datetime)
- note (text)

---

## Git Status (Modified Files)

**Modified:**
- `.claude/settings.local.json`
- `backend/jobs/views.py`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/UserMenu.jsx`
- `frontend/src/components/VendorItemForm.jsx`
- `frontend/src/pages/AuditLog.jsx`
- `frontend/src/pages/Equipment.jsx`
- `frontend/src/pages/Locations.jsx`
- `frontend/src/pages/Shipments.jsx`
- `frontend/src/pages/items.jsx`

**Untracked (New Files):**
- `.vscode/settings.json`
- `Images/` directory
- `backend/db.sqlite3.backup`
- Various migration files
- `docs/SESSION_2025-01-30_Inventory_System_Development.md`
- `frontend/public/logo-white.png`
- `frontend/public/logo.png`
- `frontend/src/App.jsx.backup`
- `frontend/src/components/Layout.jsx.backup`
- `frontend/src/pages/VendorPricingImport.jsx`
- `gse-inventory.code-workspace`

**Current Branch:** `main`

**Recent Commits:**
- `c357dbe` - feat: Add comprehensive inventory management with manufacturer tracking
- `9878ec1` - fix: Remove Dashboard link from Logistics secondary nav
- `2e643bf` - feat: Add section dashboards and update navigation styling
- `4ed5a0c` - feat: Move main navigation buttons next to logo on left
- `97f3260` - fix: Navigate to first page when clicking main nav sections

---

## Next Steps When You Resume

### Immediate Actions
1. **Start development servers** (if not running)
2. **Test Stock Levels page** - Navigate to /stock and verify functionality
3. **Create test data** if needed (InventoryMovement records)

### Potential Next Features (Based on Logical Progression)
1. **Stock Detail Modal** - Click G-code to see movement history for that item/location
2. **Stock Alerts** - Highlight low stock based on ItemLocationPolicy min_qty
3. **Receiving Workflow** - UI for creating receipt movements (currently API only)
4. **Transfer Workflow** - UI for moving stock between locations
5. **Issue Workflow** - UI for issuing stock to jobs/trucks
6. **Stock Adjustment** - UI for cycle count corrections

### Questions to Consider
1. **Do you have test InventoryMovement data?**
   - If not, we should create some to verify calculations
   - Can import via Django admin or create API test calls

2. **What's your priority workflow?**
   - Receiving inventory from POs?
   - Transferring stock between locations?
   - Issuing stock to jobs?
   - Stock adjustments/cycle counts?

3. **Reporting needs?**
   - Do you need to export stock levels to Excel?
   - Historical stock value tracking?
   - Inventory turnover metrics?

---

## Communication Preferences Confirmed

**Your Directive:**
- Act as brutally honest, high-level advisor
- Challenge assumptions, don't validate automatically
- Provide direct, unfiltered feedback
- Focus on strategic depth over emotional support
- Prioritize action over lengthy theoretical discussion
- Work with existing system, don't rebuild from scratch
- Question whether features serve real business needs

**My Approach Going Forward:**
- Question your requirements if they seem unfocused
- Push back on scope creep or feature bloat
- Identify where you're avoiding hard decisions
- Call out when you're building for "someday" vs real need
- Focus on shipping working features over perfect architecture
- Challenge you to clarify actual business processes vs hypotheticals

---

## File Reference Guide

### New Files Created This Session
- `frontend/src/pages/Stock.jsx` - Stock Levels page component
- `backend/inventory/stock_views.py` - Stock calculation API view

### Modified Files This Session
- `backend/inventory/urls.py` - Added stock-levels endpoint
- `frontend/src/App.jsx` - Added /stock route
- `frontend/src/components/Layout.jsx` - Added Stock Levels nav link

### Related Files (Context)
- `backend/inventory/models.py` - Item, InventoryMovement models
- `backend/inventory/serializers.py` - Item serializer
- `backend/inventory/views.py` - Item ViewSet
- `frontend/src/pages/items.jsx` - Item Catalog page
- `backend/vendor_imports/templates.py` - CSV import templates

---

## Summary

**What We Built:**
A complete Stock Levels feature that shows actual inventory quantities on hand by item, location, and bin. Uses event sourcing to calculate stock from InventoryMovement records, providing real-time accuracy with full audit trail.

**Why It Matters:**
Separates catalog management (what CAN be stocked) from inventory visibility (what IS in stock). Gives you actionable data for replenishment, transfers, and job planning.

**What's Next:**
Test the implementation, create sample data if needed, and decide on priority workflows for actually moving inventory (receiving, transferring, issuing).

**Key Insight from Today:**
The manufacturer column in your Item catalog isn't about vendor sourcing - it's about defining approved specifications and standards. If you're not enforcing those standards, it's decorative. If you are enforcing them, it's a critical control point. Figure out which one you are and act accordingly.

---

## Questions Left Open (For You to Answer)

1. **Do you actually enforce manufacturer standards, or is it just documentation?**
   - Affects whether manufacturer column is critical or optional
   - Determines if you need approval workflows

2. **What's your actual receiving process?**
   - Do you receive against POs?
   - Who creates InventoryMovement records?
   - What data comes from vendors vs manual entry?

3. **How do you handle stock discrepancies?**
   - Cycle count process?
   - Adjustment approvals?
   - Investigation workflow?

4. **What drives replenishment decisions?**
   - Min/max levels?
   - Historical usage?
   - Upcoming jobs?
   - Seasonal patterns?

**Don't answer these now.** Think about them. When you're ready to build the next workflow, we'll tackle them with the same brutal honesty.

---

**Session End: November 1, 2025**
**Status: Stock Levels feature complete and ready for testing**
**Servers: Running (Frontend: 5174, Backend: 8000)**
