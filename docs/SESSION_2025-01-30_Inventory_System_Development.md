# Claude Code Session - January 30, 2025
## Inventory System Development - Comprehensive Session Log

---

## Session Overview

This session focused on building a comprehensive inventory management system with:
- Multi-level catalog hierarchy
- Manufacturer tracking through the entire procurement process
- Automatic pricing updates from RFQs and PO receipts
- Bulk CSV import for items and vendor pricing
- Complete FIFO inventory costing with manufacturer tracking

---

## Key Questions & Decisions

### Initial Question: Data Import Strategy

**User Question:** "How should I get my data into the system? Should I import items and/or vendoritems?"

**Decision:** Import Items FIRST, then VendorItems
- Items = Master catalog with YOUR G-codes
- VendorItems = Vendor-specific pricing (requires Items to exist)
- CSV import endpoints created for both

**Critical Insight:** VendorItem has FK to Item, so Items must exist before importing vendor pricing.

---

### Manufacturer Tracking Problem

**User Question:** "Some items can be made by different manufacturers. Example: a 20A breaker from Notoco will be Square D, the same breaker from Teche will be Siemens, and from Elliott, Cutler Hammer."

**Problem:**
- Different vendors supply same functional item but from different manufacturers
- Need to track which manufacturer was actually received
- Inventory costing needs to track actual manufacturer per receipt

**Solution Implemented:**
- Single G-code for functional equivalent (G-100 "20A Breaker")
- Track manufacturer in **InventoryLayer** (what you actually received)
- Track expected manufacturer in **OrderLine** (what you ordered)
- Separate FIFO layers by manufacturer

**Example:**
```
Item: G-100 "20A Breaker"
  ├─ InventoryLayer: 50 units @ $11.80, Siemens, from Teche
  └─ InventoryLayer: 25 units @ $12.50, Square D, from Notoco
```

---

### Pricing Update Workflow

**User Question:** "Vendor item pricing gets updated when we create POs right?"

**Original Answer:** No, pricing was only updating on shipment receipt.

**User Insight:** "So really the vendor items page pricing should be updated when RFQs come back?"

**Revised Solution:** YES! Much better workflow:
- RFQ quote import → Updates VendorItem pricing (before PO creation)
- PO creation → Uses current VendorItem pricing
- Shipment receipt → Confirms pricing, updates if changed

**Implementation:** Updated RFQ bulk_create endpoint to update VendorItem pricing.

---

### Item Pricing Question

**User Question:** "Item prices are updated when POs are received? Because I don't see a price column on the items page, I also don't know how the items are linked to certain vendor items."

**Clarification:**
- Items don't have a "price" field
- Items have `current_replacement_cost` (estimated cost for quoting)
- VendorItem has `unit_price` (vendor-specific pricing)
- InventoryLayer has `unit_cost` (actual cost paid for inventory on hand)

**Solution:**
- Added `current_replacement_cost` column to Items page
- Auto-updates when PO received
- Shows last update date

**Link between Items and Vendors:**
- Vendor Items page (`/vendor-items`) shows all Item ↔ Vendor relationships
- Renamed to "Vendor Pricing" for clarity

---

### Catalog Navigation

**User Request:** "Give me 2 more subcategory fields, I'm thinking we might make a catalog for easy navigation"

**Implementation:** 4-level hierarchy
- category (Level 1) - e.g., "Electrical"
- subcategory (Level 2) - e.g., "Breakers"
- subcategory2 (Level 3) - e.g., "Single Pole"
- subcategory3 (Level 4) - e.g., "15-20A Range"

**UI Display:**
- Items page shows full path: "Electrical → Breakers → Single Pole → 15-20A Range"
- Category filter on main level
- Indexed for fast queries

---

### UI Refinements

**User Request:** "Can we rename the vendor items page, Vendor Catalog or Vendor Pricing?"

**Implementation:** Renamed to "Vendor Pricing" (frontend only)
- Navigation label changed
- Page messages updated
- Backend model names unchanged (VendorItem)

**User Request:** "Remove 'GSE Inventory System' from the login screen"

**Implementation:** Removed heading, now just shows logo and "Sign in to continue"

---

## Technical Implementation

### Database Schema Changes

#### Item Model (backend/inventory/models.py)
```python
class Item(models.Model):
    item_id = UUIDField(primary_key=True)
    item_name = CharField(max_length=255)
    g_code = CharField(max_length=255, unique=True)
    description = TextField(blank=True, null=True)
    category = CharField(max_length=500, blank=True, null=True)
    subcategory = CharField(max_length=500, blank=True, null=True)
    subcategory2 = CharField(max_length=500, blank=True, null=True)  # NEW
    subcategory3 = CharField(max_length=500, blank=True, null=True)  # NEW
    manufacturer = CharField(max_length=500, blank=True, null=True)
    manufacturer_part_no = CharField(max_length=500, blank=True, null=True)
    default_uom = ForeignKey(UnitOfMeasure)
    current_replacement_cost = DecimalField()  # Updated on PO receipt
    last_cost_update = DateTimeField()
```

#### InventoryLayer Model (backend/inventory/models.py)
```python
class InventoryLayer(models.Model):
    item = ForeignKey('Item')
    location = ForeignKey('Location')
    qty_remaining = DecimalField()
    unit_cost = DecimalField()  # Actual cost paid
    received_at = DateTimeField()
    purchase_order = ForeignKey('Order')

    # NEW - Manufacturer tracking
    vendor = ForeignKey('Vendor')
    manufacturer = CharField(max_length=500)
    manufacturer_part_no = CharField(max_length=500)
```

#### OrderLine Model (backend/orders/models.py)
```python
class OrderLine(models.Model):
    order = ForeignKey(Order)
    item = ForeignKey('Item')
    qty = DecimalField()
    price_each = DecimalField()

    # NEW - Expected manufacturer
    expected_manufacturer = CharField(max_length=500)
    expected_mfr_part_no = CharField(max_length=500)
```

#### VendorItemPriceHistory Model (backend/vendoritems/models.py)
```python
class VendorItemPriceHistory(models.Model):
    history_id = UUIDField(primary_key=True)
    vendor_item = ForeignKey(VendorItem)
    unit_price = DecimalField()
    effective_date = DateTimeField()
    purchase_order = ForeignKey('Order', null=True)
    changed_by = ForeignKey('User', null=True)
    notes = CharField(max_length=500)
```

---

### Automatic Price Updates

#### 1. RFQ Quote Import (backend/rfqs/views.py)
```python
@action(detail=False, methods=['post'])
def bulk_create(self, request):
    # When quotes imported:
    # 1. Create VendorQuote records
    # 2. Update/Create VendorItem with quoted price
    # 3. Create VendorItemPriceHistory entry
    # 4. Notes: "Updated from RFQ quote (RFQ #123)"
```

#### 2. Shipment Receipt (backend/shipments/signals.py)
```python
@receiver(post_save, sender=Shipment)
def update_vendor_pricing_on_receipt(sender, instance, **kwargs):
    # When shipment PICKED_UP:
    # 1. Update VendorItem.unit_price if changed
    # 2. Create VendorItemPriceHistory entry
    # 3. Notes: "Confirmed from PO receipt (Shipment #456)"

@receiver(post_save, sender=Shipment)
def create_inventory_layers_on_receipt(sender, instance, **kwargs):
    # When shipment PICKED_UP:
    # 1. Create InventoryLayer with manufacturer info
    # 2. Update Item.current_replacement_cost
    # 3. Track vendor, manufacturer, mfr_part_no
```

---

### CSV Import Endpoints

#### Items Import (backend/vendor_imports/views.py)
**Endpoint:** `/api/items-upload/`

**CSV Format:**
```csv
g_code,item_name,description,category,subcategory,subcategory2,subcategory3,manufacturer,manufacturer_part_no,default_uom
G-100,20A Breaker,Single pole,Electrical,Breakers,Single Pole,15-20A Range,,,EA
```

**Features:**
- Auto-creates UnitOfMeasure if needed
- Update or create (upsert by g_code)
- Returns created/updated counts + errors

#### Vendor Pricing Import (backend/vendor_imports/views.py)
**Endpoint:** `/api/vendor-items-upload/`

**CSV Format:**
```csv
vendor_name,item_sku,price,vendor_uom,lead_time_days
Notoco,G-100,12.50,EA,5
Teche,G-100,11.80,EA,7
```

**Key Points:**
- `item_sku` = YOUR G-code (not vendor's SKU)
- Vendor and Item must exist
- Updates VendorItem.unit_price

**Bug Fixed:** Was looking for `Item.sku` instead of `Item.g_code`

---

### Frontend Components

#### Items Page (frontend/src/pages/Items.jsx)
**Route:** `/items`

**Features:**
- Search by G-code, name, description
- Filter by category
- Display full category path (4 levels)
- Show estimated cost + last update date
- Authenticated with axiosClient

**Columns:**
- G-Code
- Item Name + Description
- Category Path (→ separated)
- Manufacturer + Part Number
- UOM
- Est. Cost (with last update date)
- Actions (Delete)

#### Items Bulk Upload (frontend/src/components/ItemsBulkUpload.jsx)
**Route:** `/upload/items` (Admin section)

**Features:**
- CSV file upload
- Field format instructions
- Example category hierarchy shown
- Upload progress/results
- Error reporting per row

#### Vendor Pricing (frontend/src/pages/VendorItems.jsx)
**Route:** `/vendor-items`

**Renamed:** "Vendor Items" → "Vendor Pricing"

**Features:**
- Search vendors/items
- Export to CSV
- Edit/Delete pricing entries
- Pagination support

#### Navigation Updates (frontend/src/components/Layout.jsx)
**Admin Section Added:**
- Import Items
- Import Vendor Pricing

**Logistics Section Updated:**
- "Vendor Items" → "Vendor Pricing"

---

## Data Flow & Workflows

### Complete Procurement to Inventory Flow

```
┌─────────────────────────────────────────┐
│ 1. Import Items (Master Catalog)       │
│    CSV: g_code, item_name, category... │
│    Result: Item records created         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 2. Import Vendor Pricing                │
│    CSV: vendor, g_code, price           │
│    Result: VendorItem records created   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 3. Create RFQ                           │
│    Add items to quote request           │
│    Send to multiple vendors             │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 4. Import RFQ Quotes                    │
│    CSV with vendor responses            │
│    ✅ VendorItem.unit_price UPDATED     │
│    ✅ VendorItemPriceHistory created    │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 5. Create Purchase Order                │
│    Select item + vendor                 │
│    Price pre-populated from VendorItem  │
│    Specify expected_manufacturer        │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 6. Receive Shipment (PICKED_UP)         │
│    ✅ InventoryLayer created            │
│    ✅ Manufacturer info recorded         │
│    ✅ VendorItem.unit_price confirmed   │
│    ✅ Item.current_replacement_cost ↑   │
│    ✅ VendorItemPriceHistory updated    │
└─────────────────────────────────────────┘
```

### Price Update Timeline Example

```
Timeline for Notoco → G-100 (20A Breaker):

Jan 10: RFQ Quote Import
  └─ VendorItem.unit_price: $12.50
  └─ History: "Updated from RFQ quote (RFQ #5)"

Jan 12: Create PO
  └─ OrderLine.price_each: $12.50 (from VendorItem)
  └─ OrderLine.expected_manufacturer: "Square D"

Jan 20: Receive Shipment
  └─ Price matches → No update needed
  └─ InventoryLayer: 50 units @ $12.50, Square D
  └─ Item.current_replacement_cost: $12.50

────────────────────────────────────

Feb 15: New RFQ Quote Import (price increased!)
  └─ VendorItem.unit_price: $13.20 ← UPDATED
  └─ History: "Updated from RFQ quote (RFQ #8)"

Feb 17: Create PO
  └─ OrderLine.price_each: $13.20 (from VendorItem)
  └─ OrderLine.expected_manufacturer: "Square D"

Feb 25: Receive Shipment (vendor gave discount!)
  └─ OrderLine.price_each: $12.80 (negotiated)
  └─ VendorItem.unit_price: $12.80 ← UPDATED to actual
  └─ History: "Confirmed from PO receipt (Shipment #89)"
  └─ InventoryLayer: 25 units @ $12.80, Square D
  └─ Item.current_replacement_cost: $12.80
```

---

## Migrations Applied

1. **inventory/migrations/0003_inventorylayer_manufacturer_and_more.py**
   - Added vendor, manufacturer, manufacturer_part_no to InventoryLayer
   - Added indexes for vendor and item+manufacturer

2. **inventory/migrations/0004_item_subcategory_item_idx_item_cat_subcat.py**
   - Added subcategory field to Item
   - Added index on category+subcategory

3. **inventory/migrations/0005_remove_item_idx_item_cat_subcat_item_subcategory2_and_more.py**
   - Added subcategory2, subcategory3 fields to Item
   - Updated index to cover all 4 levels
   - Added index on category alone

4. **orders/migrations/0006_orderline_expected_manufacturer_and_more.py**
   - Added expected_manufacturer to OrderLine
   - Added expected_mfr_part_no to OrderLine

5. **vendoritems/migrations/0004_vendoritempricehistory.py**
   - Created VendorItemPriceHistory model
   - Added indexes on vendor_item+effective_date and purchase_order

---

## Key Concepts & Design Decisions

### Items vs VendorItems vs InventoryLayers

**Item (Master Catalog)**
- YOUR internal catalog
- G-code = YOUR SKU
- One Item can have multiple vendors
- `current_replacement_cost` = Estimated cost for quoting

**VendorItem (Sourcing & Pricing)**
- Links Item ↔ Vendor
- `unit_price` = Current vendor price
- Multiple vendors can supply same Item
- Used for purchasing decisions

**InventoryLayer (Actual Stock)**
- Tracks ACTUAL inventory on hand
- `unit_cost` = What you PAID for this batch
- Separate layers by manufacturer
- FIFO costing (oldest layers consumed first)

### Why Manufacturer in InventoryLayer?

**Problem:** Same functional item (20A breaker) comes from different manufacturers depending on vendor.

**Solution:** Track manufacturer in inventory layers, not item master.

**Benefits:**
- One G-code for functional equivalent
- Separate FIFO layers by manufacturer
- Can query: "How many Square D breakers do we have?"
- Can query: "How many total 20A breakers (any brand)?"
- Know which vendor supplied which manufacturer

**Example Queries:**
```python
# Total 20A breakers (any manufacturer)
InventoryLayer.objects.filter(item__g_code='G-100') \
    .aggregate(total=Sum('qty_remaining'))

# Only Square D breakers
InventoryLayer.objects.filter(
    item__g_code='G-100',
    manufacturer='Square D'
).aggregate(total=Sum('qty_remaining'))

# What did Teche supply us?
InventoryLayer.objects.filter(vendor__name='Teche') \
    .values('item__g_code', 'manufacturer', 'qty_remaining')
```

---

## CSV Import Examples

### Items Import Example

```csv
g_code,item_name,description,category,subcategory,subcategory2,subcategory3,manufacturer,manufacturer_part_no,default_uom
G-100,20A Single Pole Breaker,Standard residential,Electrical,Breakers,Single Pole,15-20A Range,,,EA
G-101,30A Single Pole Breaker,High amperage,Electrical,Breakers,Single Pole,25-30A Range,,,EA
G-102,20A Double Pole Breaker,240V applications,Electrical,Breakers,Double Pole,15-20A Range,,,EA
G-200,1/2in Ball Valve Brass,Standard shut-off,Plumbing,Valves,Ball Type,Brass,,,EA
G-201,1/2in Ball Valve SS,Corrosion resistant,Plumbing,Valves,Ball Type,Stainless Steel,,,EA
```

**Notes:**
- manufacturer/manufacturer_part_no can be empty initially
- Populated when receiving POs from vendors
- category hierarchy can use 1-4 levels (all optional)

### Vendor Pricing Import Example

```csv
vendor_name,item_sku,price,vendor_uom,lead_time_days
Notoco,G-100,12.50,EA,5
Teche,G-100,11.80,EA,7
Elliott,G-100,13.20,EA,3
Notoco,G-200,8.50,EA,3
Teche,G-200,9.20,EA,5
```

**Important:**
- `item_sku` = YOUR G-code (not vendor's part number)
- Items must exist before importing vendor pricing
- Vendors must exist before importing

---

## Authentication Fixes

**Problem:** BulkUpload component used plain `fetch()` without authentication headers.

**Fix:** Updated to use `axiosClient` which includes Azure AD token:

```javascript
// OLD (broken)
const response = await fetch("http://127.0.0.1:8000/api/vendor-items-upload/", {
  method: "POST",
  body: formData,
});

// NEW (fixed)
const response = await axiosClient.post("vendor-items-upload/", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
```

**Applied to:**
- BulkUpload.jsx (Vendor Pricing import)
- ItemsBulkUpload.jsx (Items import)

---

## Files Modified/Created

### Backend Files Modified
- `backend/inventory/models.py` - Added subcategory fields, manufacturer tracking
- `backend/orders/models.py` - Added expected manufacturer fields
- `backend/rfqs/views.py` - Auto-update VendorItem pricing on quote import
- `backend/shipments/apps.py` - Register signals
- `backend/vendor_imports/urls.py` - Added items-upload endpoint
- `backend/vendor_imports/views.py` - Created ItemUploadView, fixed g_code lookup
- `backend/vendoritems/models.py` - Added VendorItemPriceHistory model

### Backend Files Created
- `backend/shipments/signals.py` - Auto-update pricing and create inventory layers

### Frontend Files Modified
- `frontend/src/App.jsx` - Added ItemsBulkUpload route
- `frontend/src/components/BulkUpload.jsx` - Fixed authentication
- `frontend/src/components/Layout.jsx` - Added import links, renamed "Vendor Pricing"
- `frontend/src/pages/Login.jsx` - Removed "GSE Inventory System" text
- `frontend/src/pages/VendorItems.jsx` - Updated naming to "Vendor Pricing"
- `frontend/src/pages/Items.jsx` - Complete rewrite with search, filters, cost display

### Frontend Files Created
- `frontend/src/components/ItemsBulkUpload.jsx` - Items CSV import component

### Migrations Created
- `backend/inventory/migrations/0003_*.py` - InventoryLayer manufacturer fields
- `backend/inventory/migrations/0004_*.py` - Item subcategory field
- `backend/inventory/migrations/0005_*.py` - Item subcategory2/3 fields
- `backend/orders/migrations/0006_*.py` - OrderLine manufacturer fields
- `backend/vendoritems/migrations/0004_*.py` - VendorItemPriceHistory model

---

## Testing Notes

**Not yet tested:**
- Complete RFQ → Quote Import → PO → Receipt workflow
- Manufacturer tracking through full cycle
- Price history tracking with multiple updates
- Category hierarchy navigation at all 4 levels
- Items CSV import with various field combinations

**Recommended Testing Sequence:**
1. Import sample items with 4-level categories
2. Import vendor pricing for those items
3. Create RFQ and import quotes (verify pricing updates)
4. Create PO with expected manufacturer
5. Receive shipment (verify InventoryLayer creation with manufacturer)
6. Check VendorItemPriceHistory has correct entries
7. Verify Item.current_replacement_cost updated

---

## Known Issues / Future Enhancements

### Current Limitations
1. No edit functionality on Items page (only delete)
2. No manufacturer dropdown (free text entry)
3. No validation that manufacturer on PO matches vendor's typical supply
4. No UI to view VendorItemPriceHistory
5. No bulk edit for vendor pricing
6. No warning if VendorItem doesn't exist when receiving shipment

### Potential Enhancements
1. Add Item detail page with full edit form
2. Manufacturer master table with autocomplete
3. VendorItem could track "typical manufacturer" for validation
4. Price history viewer/comparison tool
5. Bulk pricing update from vendor catalogs
6. Auto-create VendorItem on shipment receipt if missing
7. Vendor catalog comparison view (same item, multiple vendors)
8. Low inventory alerts based on ItemLocationPolicy
9. Cost variance reporting (estimated vs actual)

---

## Important Concepts for Future Sessions

### The Three "Prices"

1. **VendorItem.unit_price**
   - Current quoted/list price from vendor
   - Updated from RFQ quotes
   - Used when creating POs

2. **Item.current_replacement_cost**
   - Latest cost paid (from PO receipt)
   - Used for job quoting/estimating
   - Auto-updates on every receipt

3. **InventoryLayer.unit_cost**
   - Actual cost paid for inventory on hand
   - Used for FIFO costing
   - Never changes (historical cost)

### Manufacturer Tracking Strategy

**Don't store manufacturer in Item** because:
- Same functional part can be different manufacturers
- Depends on which vendor you buy from
- Changes over time as vendors switch suppliers

**Store manufacturer in InventoryLayer** because:
- Tracks what you ACTUALLY received
- Allows separate FIFO layers per manufacturer
- Maintains traceability

**Store expected manufacturer in OrderLine** because:
- Documents what you ordered
- Can compare expected vs received
- Helps with quality control

---

## Git Commit Information

**Commit Hash:** `c357dbe`

**Commit Message:**
```
feat: Add comprehensive inventory management with manufacturer tracking

- Add 4-level catalog hierarchy (category/subcategory/subcategory2/subcategory3)
- Add Items bulk CSV import with category support
- Fix VendorItems upload authentication (use axiosClient)
- Add manufacturer tracking to InventoryLayer (vendor, mfr, mfr_part_no)
- Add expected manufacturer fields to OrderLine
- Create VendorItemPriceHistory model for price tracking
- Auto-update VendorItem pricing on RFQ quote import
- Auto-update VendorItem pricing on shipment receipt
- Auto-update Item.current_replacement_cost on PO receipt
- Create InventoryLayer with manufacturer info on shipment receipt
- Update Items page with search, filters, category path, and cost display
- Rename "Vendor Items" to "Vendor Pricing" in frontend navigation
- Add import navigation: Admin → Import Items / Import Vendor Pricing
- Remove "GSE Inventory System" text from login screen

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Statistics:**
- 19 files changed
- 744 insertions(+), 39 deletions(-)
- 5 new migrations
- 2 new components

---

## Quick Reference for Next Session

### Starting a New Session on Different Computer

1. **Pull latest code:**
   ```bash
   cd /path/to/gse-inventory
   git pull
   ```

2. **Check what was built:**
   ```bash
   git log --oneline -5
   git show c357dbe
   ```

3. **Start Django/React:**
   ```bash
   # Backend
   cd backend
   ./venv/Scripts/python.exe manage.py runserver

   # Frontend
   cd frontend
   npm run dev
   ```

4. **Tell Claude:**
   "I'm continuing from another computer. Latest commit is c357dbe. Read this session doc and the codebase to understand what we built."

### Key Navigation Routes

- Items catalog: `/items`
- Vendor pricing: `/vendor-items`
- Import items: `/upload/items` (Admin section)
- Import vendor pricing: `/upload/vendor-items` (Admin section)

### Key Backend Endpoints

- Items CRUD: `/api/items/`
- Items bulk upload: `/api/items-upload/`
- VendorItems CRUD: `/api/vendoritems/`
- VendorItems bulk upload: `/api/vendor-items-upload/`
- RFQ quote bulk import: `/api/vendor-quotes/bulk_create/`

---

## Session End

**Date:** January 30, 2025
**Duration:** Full day session
**Status:** All changes committed and pushed to GitHub
**Next Steps:** Test complete workflow from RFQ → Receipt with manufacturer tracking

---

*This document was automatically generated from the Claude Code session transcript and can be referenced from any computer by pulling the latest Git repository.*
