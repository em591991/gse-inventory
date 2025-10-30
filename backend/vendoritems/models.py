from django.db import models
from vendors.models import Vendor
from inventory.models import Item, UnitOfMeasure
import uuid
from django.utils import timezone


class VendorItem(models.Model):
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="vendor_items"
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="vendor_items"
    )
    # ADD THIS: Link to manufacturer part
    mfr_part = models.ForeignKey(
        'manufacturers.ManufacturerPart',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_items'
    )

    vendor_sku = models.CharField(max_length=500, blank=True, null=True)
    vendor_uom = models.ForeignKey(
        UnitOfMeasure,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_items"
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    conversion_factor = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    lead_time_days = models.PositiveIntegerField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['vendor', 'item'], 
                name='unique_vendor_item'
            ),
            models.UniqueConstraint(
                fields=['vendor', 'vendor_sku'], 
                name='unique_vendor_sku_per_vendor'
            )
        ]
        indexes = [
            models.Index(fields=['item'], name='idx_vendor_item_item_id'),
            models.Index(fields=['mfr_part'], name='idx_vendor_item_mfr_part'),
        ]
        verbose_name = "Vendor Item"
        verbose_name_plural = "Vendor Items"

    def __str__(self):
        return f"{self.vendor.name} - {self.item.item_name}"


class VendorItemPriceHistory(models.Model):
    """
    Tracks historical pricing changes for vendor items.
    Created automatically when:
    - PO is received (shipment picked up)
    - Manual price updates
    """
    history_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    vendor_item = models.ForeignKey(
        VendorItem,
        on_delete=models.CASCADE,
        related_name='price_history'
    )

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price at this point in time"
    )

    effective_date = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="When this price became effective"
    )

    # Optional reference to the PO that triggered this price
    purchase_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_price_changes'
    )

    changed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who triggered the price change (if manual)"
    )

    notes = models.CharField(
        max_length=500,
        blank=True,
        help_text="Reason for price change or notes"
    )

    class Meta:
        db_table = 'vendor_item_price_history'
        ordering = ['-effective_date']
        indexes = [
            models.Index(fields=['vendor_item', '-effective_date'], name='idx_price_hist_vi_date'),
            models.Index(fields=['purchase_order'], name='idx_price_hist_po'),
        ]
        verbose_name = "Vendor Item Price History"
        verbose_name_plural = "Vendor Item Price History"

    def __str__(self):
        return f"{self.vendor_item} - ${self.unit_price} @ {self.effective_date.date()}"