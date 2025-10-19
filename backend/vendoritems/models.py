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

    vendor_sku = models.CharField(max_length=100, blank=True, null=True)
    vendor_uom = models.ForeignKey(
        UnitOfMeasure,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_items"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    conversion_factor = models.DecimalField(max_digits=10, decimal_places=4, default=1)
    lead_time_days = models.PositiveIntegerField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        # Add vendor_sku to the unique constraint
        constraints = [
            models.UniqueConstraint(fields=['vendor', 'item', 'vendor_sku'], name='unique_vendor_item_sku')
        ]
        verbose_name = "Vendor Item"
        verbose_name_plural = "Vendor Items"

    def __str__(self):
        return f"{self.vendor.name} - {self.item.name} - {self.vendor_sku}"

