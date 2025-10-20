from django.db import models
from vendors.models import Vendor
from inventory.models import Item, UnitOfMeasure


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