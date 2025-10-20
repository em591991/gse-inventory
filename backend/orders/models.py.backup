from django.db import models
from vendors.models import Vendor
from inventory.models import Item
from vendoritems.models import VendorItem
from django.utils import timezone

class MyModel(models.Model):
    start_date = models.DateField(default=timezone.now)


class Order(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=50, default='Pending')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.vendor.name} ({self.status})"

    @property
    def total_cost(self):
        return sum(item.total_price for item in self.order_items.all())
    

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        # Try to pull the vendor-specific price automatically
        vendor_item = VendorItem.objects.filter(
            vendor=self.order.vendor, item=self.item
        ).first()

        if vendor_item:
            self.unit_price = vendor_item.price

        # Always recalc total_price
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item.name} x{self.quantity} @ {self.unit_price}"
