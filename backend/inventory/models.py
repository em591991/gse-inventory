from django.db import models
from vendors.models import Vendor
import uuid



# ==============================
#  UNIT OF MEASURE
# ==============================
class UnitOfMeasure(models.Model):
    uom_code = models.CharField(max_length=32, primary_key=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Units of Measure"

    def __str__(self):
        return self.uom_code


# ==============================
#  ITEM MASTER (UPDATED)
# ==============================
class Item(models.Model):
    item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item_name = models.CharField(max_length=255)
    g_code = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=500, blank=True, null=True)
    manufacturer = models.CharField(max_length=500, blank=True, null=True)
    manufacturer_part_no = models.CharField(max_length=500, blank=True, null=True)

    default_uom = models.ForeignKey(
        UnitOfMeasure,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_items"
    )

    vendors = models.ManyToManyField(
        'vendors.Vendor',
        through='vendoritems.VendorItem',
        related_name='items'
    )

    class Meta:
        indexes = [
            models.Index(fields=['g_code'], name='idx_item_gcode'),
        ]

    def __str__(self):
        return f"{self.g_code} - {self.item_name}"

# ==============================
#  VENDOR-ITEM RELATIONSHIP
# ==============================

# ==============================
#  LOCATIONS & BINS
# ==============================



class Location(models.Model):
    """
    ERD Table: locations
    Physical locations where inventory, vehicles, tools, and equipment are stored
    """
    # Primary key must be location_id (UUID) per ERD
    location_id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )
    
    # ERD: name varchar(120) [not null]
    name = models.CharField(max_length=120)
    
    # ERD: type varchar(120) [not null]
    LOCATION_TYPES = [
        ("WAREHOUSE", "Warehouse"),
        ("TRUCK", "Truck"),
        ("JOB", "Jobsite"),
        ("STORAGE", "Storage"),
    ]
    type = models.CharField(max_length=120, choices=LOCATION_TYPES)
    
    # ERD: is_active boolean [not null]
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'locations'
        indexes = [
            models.Index(fields=["name", "type"], name="idx_locations_name_type"),
        ]

    def __str__(self):
        return f"{self.name} ({self.type})"


class Bin(models.Model):
    """ERD Table: bins"""
    bin_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="bins",
        db_column='location_id'  # ← Add this!
    )
    
    bin_code = models.CharField(max_length=64)

    class Meta:
        db_table = 'bins'
        unique_together = ("location", "bin_code")
        indexes = [
            models.Index(fields=["location", "bin_code"], name="uq_bins_per_location"),
        ]

    def __str__(self):
        return f"{self.location.name} – {self.bin_code}"

class ItemDefaultBin(models.Model):
    item = models.ForeignKey("inventory.Item", on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE,db_column='location_id')
    bin = models.ForeignKey(Bin, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("item", "location")
        indexes = [
            models.Index(fields=["item", "location"], name="pk_item_default_bin"),
        ]

    def __str__(self):
        return f"{self.item.name} @ {self.location.name} - {self.bin.bin_code}"
    
# ==============================
#  INVENTORY MOVEMENTS
# ==============================
class InventoryMovement(models.Model):
    item = models.ForeignKey("inventory.Item", on_delete=models.CASCADE)
    qty = models.DecimalField(max_digits=14, decimal_places=4)
    uom = models.ForeignKey(
        "inventory.UnitOfMeasure", on_delete=models.SET_NULL, null=True
    )
    moved_at = models.DateTimeField(auto_now_add=True)

    from_location = models.ForeignKey(
        "inventory.Location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="outgoing_movements",
        db_column='from_location_id'
    )
    from_bin = models.ForeignKey(
        "inventory.Bin",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="outgoing_bin_movements",
    )
    to_location = models.ForeignKey(
        "inventory.Location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_movements",
        db_column='to_location_id'
    )
    to_bin = models.ForeignKey(
        "inventory.Bin",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_bin_movements",
    )

    note = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["item"], name="idx_mov_item"),
            models.Index(fields=["moved_at"], name="idx_mov_time"),
        ]
        verbose_name = "Inventory Movement"
        verbose_name_plural = "Inventory Movements"

    def __str__(self):
        direction = (
            f"{self.from_location} → {self.to_location}"
            if self.from_location and self.to_location
            else "Movement"
        )
        return f"{self.item.name} ({self.qty} {self.uom}) - {direction}"

# ==============================
#  ITEM LOCATION POLICIES
# ==============================

class ItemLocationPolicy(models.Model):
    item = models.ForeignKey("inventory.Item", on_delete=models.CASCADE)
    location = models.ForeignKey("inventory.Location", on_delete=models.CASCADE,db_column='location_id')
    min_qty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    max_qty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    reorder_qty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    lead_time_days = models.IntegerField(null=True, blank=True)
    preferred_vendor = models.ForeignKey(
        "vendors.Vendor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="preferred_policies"
    )

    class Meta:
        unique_together = ("item", "location")
        indexes = [
            models.Index(fields=["item", "location"], name="pk_item_loc_policies"),
            models.Index(fields=["preferred_vendor"], name="idx_ilp_vendor"),
        ]
        verbose_name = "Item Location Policy"
        verbose_name_plural = "Item Location Policies"

    def __str__(self):
        return f"{self.item.name} @ {self.location.name}"



