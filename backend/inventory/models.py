from django.db import models

class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.sku})"
