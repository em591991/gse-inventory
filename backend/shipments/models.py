import uuid
from django.db import models
from django.utils import timezone


class ShipmentStatus(models.TextChoices):
    """ERD enum: shipment_status"""
    PICKING = 'PICKING', 'Picking'
    STAGED = 'STAGED', 'Staged'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    CANCELED = 'CANCELED', 'Canceled'


class Shipment(models.Model):
    """
    ERD Table: shipments
    Tracks order shipments from staging to pickup
    """
    shipment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        db_column='order_id',
        related_name='shipments'
    )
    staging_location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='staging_location_id',
        related_name='staged_shipments'
    )
    staging_bin = models.ForeignKey(
        'inventory.Bin',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='staging_bin_id',
        related_name='staged_shipments'
    )
    status = models.CharField(
        max_length=20,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PICKING
    )
    created_at = models.DateTimeField(default=timezone.now)
    staged_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'shipments'
        indexes = [
            models.Index(fields=['order'], name='idx_shipment_order'),
            models.Index(fields=['status'], name='idx_shipment_status'),
            models.Index(fields=['staging_location'], name='idx_shipment_stage_loc'),
            models.Index(fields=['staging_bin'], name='idx_shipment_stage_bin'),
        ]

    def __str__(self):
        return f"Shipment {self.shipment_id} - {self.status}"


class ShipmentLine(models.Model):
    """
    ERD Table: shipment_lines
    Individual line items within a shipment
    """
    shipment_line_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        db_column='shipment_id',
        related_name='lines'
    )
    order_line = models.ForeignKey(
        'orders.OrderLine', 
        on_delete=models.CASCADE,
        db_column='order_line_id',
        related_name='shipment_lines'
    )
    qty_to_ship = models.DecimalField(max_digits=14, decimal_places=4)
    qty_picked = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'shipment_lines'
        constraints = [
            models.UniqueConstraint(
                fields=['shipment', 'order_line'],
                name='uq_shipment_line'
            )
        ]
        indexes = [
            models.Index(fields=['shipment'], name='idx_shipment_lines_shipment'),
            models.Index(fields=['order_line'], name='idx_shipment_lines_order_line'),
        ]

    def __str__(self):
        return f"ShipmentLine {self.shipment_line_id}"

