from django.db import models
from vendors.models import Vendor
import uuid
from django.utils import timezone



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

    current_replacement_cost = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Latest purchase price for quoting new jobs"
    )

    last_cost_update = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When cost was last updated"
    )

    def update_replacement_cost(self, new_cost):
        """Update current replacement cost from latest purchase"""
        from django.utils import timezone
        self.current_replacement_cost = new_cost
        self.last_cost_update = timezone.now()
        self.save(update_fields=['current_replacement_cost', 'last_cost_update'])    

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
    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Cost per unit at time of movement"
    )
    total_cost = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Total cost (qty × unit_cost)"
    )
    is_estimated = models.BooleanField(
        default=False,
        help_text="True if cost is estimated (from pending allocation)"
    )

    actual_cost_variance = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Difference between estimated and actual cost"
    )
    work_order = models.ForeignKey(
        'jobs.WorkOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_movements',
        db_column='work_order_id'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_movements',
        db_column='order_id'
    )
    
    order_line = models.ForeignKey(
        'orders.OrderLine',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_movements',
        db_column='order_line_id'
    )
    
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Reference code or identifier"
    )
    note = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'inventory_movements'
        indexes = [
            models.Index(fields=["item"], name="idx_mov_item"),
            models.Index(fields=["moved_at"], name="idx_mov_time"),
            models.Index(
                fields=['work_order', 'total_cost'],
                name='idx_mov_work_order_cost'
            ),
            models.Index(
            fields=['order', 'order_line'],
            name='idx_mov_order_line'
            ),
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
    
    def save(self, *args, **kwargs):
        from decimal import Decimal
        # Auto-calculate total_cost if not provided
        if self.unit_cost and self.qty and not self.total_cost:
             self.total_cost = abs(Decimal(str(self.qty))) * Decimal(str(self.unit_cost))
        super().save(*args, **kwargs)

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



# =====================================================
# FIFO COSTING MODELS
# =====================================================

class InventoryLayer(models.Model):
    """
    Tracks inventory cost layers for FIFO costing.
    Each receipt creates a new layer with its own cost.
    Oldest layers are consumed first.
    """
    layer_id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False,
        db_column='layer_id'
    )
    
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='inventory_layers',
        db_column='item_id'
    )
    
    location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='inventory_layers',
        db_column='location_id'
    )
    
    bin = models.ForeignKey(
        'Bin',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_layers',
        db_column='bin_id'
    )
    
    qty_remaining = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        help_text="Quantity still available in this layer"
    )
    
    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        help_text="Cost per unit for this layer"
    )
    
    received_at = models.DateTimeField(
        default=timezone.now,
        db_column='received_at',
        help_text="When this inventory was received"
    )
    
    purchase_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_layers',
        db_column='purchase_order_id'
    )
    
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Reference for manual adjustments or notes"
    )
    
    class Meta:
        db_table = 'inventory_layers'
        ordering = ['received_at']  # FIFO: oldest first
        indexes = [
            models.Index(
                fields=['item', 'location', 'received_at'],
                name='idx_layer_fifo_lookup'
            ),
            models.Index(fields=['item'], name='idx_layer_item'),
            models.Index(fields=['location'], name='idx_layer_location'),
            models.Index(fields=['received_at'], name='idx_layer_received'),
        ]
        verbose_name = 'Inventory Layer'
        verbose_name_plural = 'Inventory Layers'
    
    def __str__(self):
        return (
            f"{self.item.g_code} @ {self.location.name} - "
            f"{self.qty_remaining} units @ ${self.unit_cost}"
        )
    
    @property
    def total_value(self):
        """Calculate total value of this layer"""
        return self.qty_remaining * self.unit_cost


class PendingAllocation(models.Model):
    """
    Tracks materials allocated but not yet in stock.
    Created when allocating more than available.
    Auto-fulfilled when inventory received.
    """
    
    class Status(models.TextChoices):
        AWAITING_RECEIPT = 'AWAITING_RECEIPT', 'Awaiting Receipt'
        PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED', 'Partially Fulfilled'
        FULFILLED = 'FULFILLED', 'Fulfilled'
        CANCELED = 'CANCELED', 'Canceled'
    
    pending_allocation_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_column='pending_allocation_id'
    )
    
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='pending_allocations',
        db_column='item_id'
    )
    
    location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='pending_allocations',
        db_column='location_id'
    )
    
    work_order = models.ForeignKey(
        'jobs.WorkOrder',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='pending_allocations',
        db_column='work_order_id'
    )
    
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='pending_allocations',
        db_column='order_id'
    )
    
    qty = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        help_text="Quantity pending fulfillment"
    )
    
    estimated_unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Estimated cost (from last purchase)"
    )
    
    estimated_total_cost = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Estimated total cost"
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AWAITING_RECEIPT,
        db_column='status'
    )
    
    created_at = models.DateTimeField(
        default=timezone.now,
        db_column='created_at'
    )
    
    fulfilled_at = models.DateTimeField(
        null=True,
        blank=True,
        db_column='fulfilled_at'
    )
    
    notes = models.CharField(
        max_length=500,
        blank=True
    )
    
    class Meta:
        db_table = 'pending_allocations'
        indexes = [
            models.Index(
                fields=['item', 'status'],
                name='idx_pending_item_status'
            ),
            models.Index(fields=['work_order'], name='idx_pending_wo'),
            models.Index(fields=['status'], name='idx_pending_status'),
            models.Index(fields=['created_at'], name='idx_pending_created'),
        ]
        verbose_name = 'Pending Allocation'
        verbose_name_plural = 'Pending Allocations'
    
    def __str__(self):
        return (
            f"{self.item.g_code} - {self.qty} units pending "
            f"({self.status})"
        )
    
    def save(self, *args, **kwargs):
        # Auto-calculate estimated total cost
        if not self.estimated_total_cost and self.estimated_unit_cost and self.qty:
            from decimal import Decimal
            self.estimated_total_cost = Decimal(str(self.qty)) * Decimal(str(self.estimated_unit_cost))
        super().save(*args, **kwargs)