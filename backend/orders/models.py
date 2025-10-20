from django.db import models
import uuid
from django.utils import timezone


class OrderType(models.TextChoices):
    PURCHASE = 'PURCHASE', 'Purchase Order'
    SALES = 'SALES', 'Sales Order'
    TRANSFER = 'TRANSFER', 'Transfer'
    RETURN = 'RETURN', 'Return'
    RMA = 'RMA', 'RMA'
    ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'


class OrderStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    OPEN = 'OPEN', 'Open'
    PARTIAL = 'PARTIAL', 'Partial'
    CLOSED = 'CLOSED', 'Closed'
    CANCELED = 'CANCELED', 'Canceled'


class PurchaseCategory(models.TextChoices):
    MATERIAL = 'MATERIAL', 'Material'
    TOOL = 'TOOL', 'Tool'
    EQUIPMENT = 'EQUIPMENT', 'Equipment'
    VEHICLE = 'VEHICLE', 'Vehicle'
    SERVICE = 'SERVICE', 'Service'
    OTHER = 'OTHER', 'Other'


class Order(models.Model):
    order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_type = models.CharField(max_length=20, choices=OrderType.choices)
    order_status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.DRAFT)
    ordered_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    
    # Optional references - depends on order type
    work_order = models.ForeignKey(
        'workorders.WorkOrder', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='orders'
    )
    job = models.ForeignKey(
        'jobs.Job', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='orders'
    )
    customer = models.ForeignKey(
        'customers.Customer', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='orders'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='orders'
    )
    
    # For transfers
    from_location = models.ForeignKey(
        'inventory.Location', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='orders_from'
    )
    to_location = models.ForeignKey(
        'inventory.Location', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='orders_to'
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['order_type', 'order_status'], name='idx_orders_type_status'),
            models.Index(fields=['work_order'], name='idx_orders_wo'),
            models.Index(fields=['job'], name='idx_orders_job'),
            models.Index(fields=['customer'], name='idx_orders_customer'),
            models.Index(fields=['vendor'], name='idx_orders_vendor'),
            models.Index(fields=['from_location'], name='idx_orders_from_loc'),
            models.Index(fields=['to_location'], name='idx_orders_to_loc'),
        ]
    
    def __str__(self):
        return f"{self.get_order_type_display()} - {self.order_status}"
    
    @property
    def total_cost(self):
        """Calculate total cost from all order lines"""
        return sum(
            (line.qty * (line.price_each or 0)) 
            for line in self.lines.all()
        )


class OrderLine(models.Model):
    order_line_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lines')
    line_no = models.IntegerField()
    
    item = models.ForeignKey(
        'inventory.Item', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='order_lines'
    )
    purchase_category = models.CharField(max_length=20, choices=PurchaseCategory.choices)
    description = models.CharField(max_length=500)
    
    uom = models.ForeignKey(
        'inventory.UnitOfMeasure', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='order_lines'
    )
    qty = models.DecimalField(max_digits=14, decimal_places=4)
    price_each = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    
    # For transfers - which bins
    from_bin = models.ForeignKey(
        'inventory.Bin', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='orderlines_from'
    )
    to_bin = models.ForeignKey(
        'inventory.Bin', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='orderlines_to'
    )
    
    g_code = models.CharField(max_length=255, blank=True, null=True)
    notes = models.CharField(max_length=500, blank=True, null=True)
    
    class Meta:
        unique_together = ('order', 'line_no')
        indexes = [
            models.Index(fields=['order', 'line_no'], name='uq_order_line_no'),
            models.Index(fields=['item'], name='idx_ol_item'),
        ]
    
    def __str__(self):
        return f"Line {self.line_no}: {self.description}"
    
    @property
    def total_price(self):
        """Calculate line total"""
        if self.price_each:
            return self.qty * self.price_each
        return 0


# ==============================
#  SALES ORDER INFO (Additional fields for sales orders)
# ==============================
class SalesOrderInfo(models.Model):
    order = models.OneToOneField(
        Order, 
        primary_key=True, 
        on_delete=models.CASCADE,
        related_name='sales_info'
    )
    ship_to_name = models.CharField(max_length=255, blank=True, null=True)
    ship_to_address = models.CharField(max_length=500, blank=True, null=True)
    ship_to_city = models.CharField(max_length=200, blank=True, null=True)
    ship_to_state = models.CharField(max_length=100, blank=True, null=True)
    ship_to_postal = models.CharField(max_length=40, blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    contact_email = models.EmailField(max_length=320, blank=True, null=True)
    
    def __str__(self):
        return f"Sales Info for Order {self.order.order_id}"