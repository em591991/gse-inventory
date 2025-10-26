# locations/models.py
import uuid
from django.db import models


class Location(models.Model):
    """
    ERD Table: locations
    Storage locations for inventory, tools, vehicles, equipment
    Used across multiple apps as a foundational entity
    """
    LOCATION_TYPES = [
        ("WAREHOUSE", "Warehouse"),
        ("TRUCK", "Truck"),
        ("JOB", "Jobsite"),
        ("STORAGE", "Storage"),
    ]

    # PRIMARY KEY: location_id (UUID) - matches ERD
    location_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # REQUIRED FIELDS - match ERD exactly
    name = models.CharField(max_length=120, blank=False)
    type = models.CharField(max_length=120, choices=LOCATION_TYPES, blank=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'locations'
        indexes = [
            models.Index(fields=["name", "type"], name="idx_locations_name_type"),
        ]
        verbose_name = "Location"
        verbose_name_plural = "Locations"

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"