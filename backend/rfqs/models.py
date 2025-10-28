# backend/rfqs/models.py
"""
RFQ (Request for Quote) Models
Handles vendor quote requests, responses, and replenishment order creation
"""
from django.db import models
import uuid
from django.utils import timezone


class RFQStatus(models.TextChoices):
    """Status choices for RFQ"""
    DRAFT = 'DRAFT', 'Draft'
    SENT = 'SENT', 'Sent to Vendors'
    QUOTED = 'QUOTED', 'Quotes Received'
    COMPLETED = 'COMPLETED', 'Completed (POs Created)'
    CANCELLED = 'CANCELLED', 'Cancelled'


class RFQVendorStatus(models.TextChoices):
    """Status choices for vendor response to RFQ"""
    PENDING = 'PENDING', 'Pending Response'
    QUOTED = 'QUOTED', 'Quote Received'
    DECLINED = 'DECLINED', 'Declined to Quote'
    NO_RESPONSE = 'NO_RESPONSE', 'No Response'


class ReplenishmentStatus(models.TextChoices):
    """Status choices for replenishment order"""
    DRAFT = 'DRAFT', 'Draft'
    FINALIZED = 'FINALIZED', 'Finalized'
    POS_CREATED = 'POS_CREATED', 'POs Created'


class RFQ(models.Model):
    """
    Request for Quote
    Main header for requesting quotes from vendors
    """
    rfq_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq_number = models.CharField(max_length=50, unique=True, help_text='Format: RFQ-YYYY-Q-###')
    description = models.TextField(blank=True, help_text='Purpose/description of this RFQ')
    status = models.CharField(
        max_length=20,
        choices=RFQStatus.choices,
        default=RFQStatus.DRAFT
    )

    # Dates
    created_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True, help_text='When RFQ was sent to vendors')
    quote_deadline = models.DateField(null=True, blank=True, help_text='Vendor quote deadline')

    # User tracking
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rfqs_created',
        help_text='User who created this RFQ'
    )

    class Meta:
        db_table = 'rfqs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rfq_number'], name='idx_rfq_number'),
            models.Index(fields=['status'], name='idx_rfq_status'),
            models.Index(fields=['created_at'], name='idx_rfq_created'),
        ]

    def __str__(self):
        return f"{self.rfq_number} - {self.description[:50] if self.description else 'No description'}"


class RFQLine(models.Model):
    """
    RFQ Line Item
    Items being requested for quote
    """
    rfq_line_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(
        RFQ,
        on_delete=models.CASCADE,
        related_name='lines',
        help_text='Parent RFQ'
    )
    line_no = models.IntegerField(help_text='Line number within RFQ')

    # Item details
    item = models.ForeignKey(
        'inventory.Item',
        on_delete=models.PROTECT,
        related_name='rfq_lines',
        help_text='Item being requested'
    )
    qty_requested = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text='Quantity requested'
    )
    uom = models.ForeignKey(
        'inventory.UnitOfMeasure',
        on_delete=models.PROTECT,
        related_name='rfq_lines',
        help_text='Unit of measure'
    )

    # Additional info
    notes = models.TextField(blank=True, help_text='Special requirements, notes')

    class Meta:
        db_table = 'rfq_lines'
        unique_together = ('rfq', 'line_no')
        ordering = ['rfq', 'line_no']
        indexes = [
            models.Index(fields=['rfq', 'line_no'], name='idx_rfq_line'),
            models.Index(fields=['item'], name='idx_rfq_line_item'),
        ]

    def __str__(self):
        return f"{self.rfq.rfq_number} - Line {self.line_no}: {self.item}"


class RFQVendor(models.Model):
    """
    RFQ Vendor Association
    Tracks which vendors received this RFQ and their response status
    """
    rfq_vendor_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(
        RFQ,
        on_delete=models.CASCADE,
        related_name='rfq_vendors',
        help_text='Parent RFQ'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='rfqs_received',
        help_text='Vendor who received this RFQ'
    )

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=RFQVendorStatus.choices,
        default=RFQVendorStatus.PENDING
    )
    sent_at = models.DateTimeField(null=True, blank=True, help_text='When RFQ was sent to this vendor')
    responded_at = models.DateTimeField(null=True, blank=True, help_text='When vendor responded')

    # Contact info (snapshot at time of RFQ)
    contact_email = models.EmailField(blank=True, help_text='Vendor contact email at time of RFQ')
    contact_name = models.CharField(max_length=255, blank=True, help_text='Vendor contact name')

    class Meta:
        db_table = 'rfq_vendors'
        unique_together = ('rfq', 'vendor')
        indexes = [
            models.Index(fields=['rfq'], name='idx_rfqv_rfq'),
            models.Index(fields=['vendor'], name='idx_rfqv_vendor'),
            models.Index(fields=['status'], name='idx_rfqv_status'),
        ]

    def __str__(self):
        return f"{self.rfq.rfq_number} - {self.vendor.name} ({self.status})"


class VendorQuote(models.Model):
    """
    Vendor Quote
    Vendor's pricing response for a specific RFQ line item
    """
    quote_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq_line = models.ForeignKey(
        RFQLine,
        on_delete=models.CASCADE,
        related_name='vendor_quotes',
        help_text='RFQ line this quote is for'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='quotes',
        help_text='Vendor providing the quote'
    )

    # Link to vendor catalog if exists
    vendor_item = models.ForeignKey(
        'vendoritems.VendorItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotes',
        help_text='Link to vendor catalog item if exists'
    )

    # Quote details
    price_each = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Price per unit'
    )
    qty_available = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text='Quantity available from vendor'
    )
    lead_time_days = models.IntegerField(
        null=True,
        blank=True,
        help_text='Lead time in days'
    )

    # Product details from vendor
    manufacturer = models.CharField(max_length=255, blank=True, help_text='Manufacturer name')
    manufacturer_part_number = models.CharField(
        max_length=255,
        blank=True,
        help_text='Manufacturer part number'
    )
    vendor_part_number = models.CharField(
        max_length=255,
        blank=True,
        help_text='Vendor\'s part number'
    )

    # Metadata
    quoted_at = models.DateTimeField(default=timezone.now, help_text='When quote was received')
    valid_until = models.DateField(null=True, blank=True, help_text='Quote expiration date')
    notes = models.TextField(blank=True, help_text='Additional notes from vendor')

    # Selection tracking (used in replenishment view)
    is_selected = models.BooleanField(
        default=False,
        help_text='Whether this quote was selected for ordering'
    )

    class Meta:
        db_table = 'vendor_quotes'
        unique_together = ('rfq_line', 'vendor')
        indexes = [
            models.Index(fields=['rfq_line'], name='idx_vq_rfq_line'),
            models.Index(fields=['vendor'], name='idx_vq_vendor'),
            models.Index(fields=['quoted_at'], name='idx_vq_quoted'),
        ]

    def __str__(self):
        return f"{self.vendor.name} quote for {self.rfq_line}: ${self.price_each}"


class ReplenishmentOrder(models.Model):
    """
    Replenishment Order
    Staging area for vendor selections before creating POs
    """
    replenishment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(
        RFQ,
        on_delete=models.CASCADE,
        related_name='replenishment_orders',
        help_text='Source RFQ'
    )
    status = models.CharField(
        max_length=20,
        choices=ReplenishmentStatus.choices,
        default=ReplenishmentStatus.DRAFT
    )

    # Tracking
    created_at = models.DateTimeField(default=timezone.now)
    finalized_at = models.DateTimeField(null=True, blank=True, help_text='When selections were finalized')
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replenishment_orders',
        help_text='User who created replenishment'
    )

    class Meta:
        db_table = 'replenishment_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rfq'], name='idx_repl_rfq'),
            models.Index(fields=['status'], name='idx_repl_status'),
        ]

    def __str__(self):
        return f"Replenishment for {self.rfq.rfq_number}"


class ReplenishmentLine(models.Model):
    """
    Replenishment Line
    User's vendor selection for each item
    Supports partial quantity splits across multiple vendors
    """
    replenishment_line_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    replenishment = models.ForeignKey(
        ReplenishmentOrder,
        on_delete=models.CASCADE,
        related_name='lines',
        help_text='Parent replenishment order'
    )
    rfq_line = models.ForeignKey(
        RFQLine,
        on_delete=models.CASCADE,
        related_name='replenishment_lines',
        help_text='Source RFQ line'
    )
    selected_vendor_quote = models.ForeignKey(
        VendorQuote,
        on_delete=models.PROTECT,
        related_name='replenishment_selections',
        help_text='Selected vendor quote'
    )

    # Ordering details
    qty_to_order = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text='Quantity to order from this vendor (may be less than requested for splits)'
    )

    # Link to created PO (populated after PO creation)
    purchase_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replenishment_lines',
        help_text='Purchase order created from this selection'
    )

    class Meta:
        db_table = 'replenishment_lines'
        ordering = ['replenishment', 'rfq_line']
        indexes = [
            models.Index(fields=['replenishment'], name='idx_repl_line_repl'),
            models.Index(fields=['rfq_line'], name='idx_repl_line_rfq'),
            models.Index(fields=['purchase_order'], name='idx_repl_line_po'),
        ]

    def __str__(self):
        return f"{self.replenishment} - {self.rfq_line.item} from {self.selected_vendor_quote.vendor.name}"
