from django.db import models

# in vendors/models.py
# vendors/models.py

class Vendor(models.Model):
    TYPE_CHOICES = [
        ("vendor", "Vendor"),
        ("subcontractor", "Subcontractor"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="vendor")

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

