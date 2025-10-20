
from django.db import models
import uuid

class Manufacturer(models.Model):
    manufacturer_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    support_email = models.EmailField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name


class ManufacturerPart(models.Model):
    mfr_part_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE, related_name='parts')
    part_number = models.CharField(max_length=255)
    description = models.CharField(max_length=500, blank=True, null=True)
    upc = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        unique_together = ('manufacturer', 'part_number')
        indexes = [
            models.Index(fields=['manufacturer', 'part_number'], name='uq_mfr_part_per_mfr'),
        ]

    def __str__(self):
        return f"{self.manufacturer.name} - {self.part_number}"


class ItemManufacturerPart(models.Model):
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE, related_name='manufacturer_parts')
    mfr_part = models.ForeignKey(ManufacturerPart, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)

    class Meta:
        unique_together = ('item', 'mfr_part')
        indexes = [
            models.Index(fields=['item', 'mfr_part'], name='pk_item_mfr_part'),
            models.Index(fields=['item'], name='idx_item_mfr_lookup'),
        ]

    def __str__(self):
        return f"{self.item.item_name} - {self.mfr_part.part_number}"