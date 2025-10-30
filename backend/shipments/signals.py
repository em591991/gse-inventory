"""
Signals for shipment processing.
Automatically updates VendorItem pricing and creates inventory layers when goods are received.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Shipment
from vendoritems.models import VendorItem, VendorItemPriceHistory
from inventory.models import InventoryLayer


@receiver(post_save, sender=Shipment)
def update_vendor_pricing_on_receipt(sender, instance, created, **kwargs):
    """
    When a shipment is marked as PICKED_UP (received), update VendorItem pricing
    based on the actual prices from the PO.

    This creates price history records and updates current pricing.
    """
    # Only process when shipment becomes PICKED_UP
    if instance.status != 'PICKED_UP':
        return

    # Get the associated order
    order = instance.order
    if not order or not order.vendor:
        return  # Not a vendor purchase order

    # Only process purchase orders
    if order.order_type != 'PURCHASE':
        return

    # Process each line in the order
    for order_line in order.lines.all():
        # Skip lines without items or prices
        if not order_line.item or not order_line.price_each:
            continue

        # Find or skip VendorItem
        try:
            vendor_item = VendorItem.objects.get(
                vendor=order.vendor,
                item=order_line.item
            )
        except VendorItem.DoesNotExist:
            # VendorItem doesn't exist yet - could auto-create, but skipping for now
            continue

        # Check if price has changed (avoid duplicate history entries)
        if vendor_item.unit_price == order_line.price_each:
            continue  # Price unchanged, skip

        # Create price history record (actual receipt confirms pricing)
        VendorItemPriceHistory.objects.create(
            vendor_item=vendor_item,
            unit_price=order_line.price_each,
            effective_date=instance.picked_up_at or timezone.now(),
            purchase_order=order,
            notes=f"Confirmed from PO receipt (Shipment {instance.shipment_id})"
        )

        # Update current price on VendorItem (receipt confirms the price)
        vendor_item.unit_price = order_line.price_each
        vendor_item.save(update_fields=['unit_price', 'last_updated'])


@receiver(post_save, sender=Shipment)
def create_inventory_layers_on_receipt(sender, instance, created, **kwargs):
    """
    When a shipment is marked as PICKED_UP (received), create InventoryLayers
    for the received goods with manufacturer tracking.

    This creates FIFO cost layers with actual manufacturer info from the PO.
    """
    # Only process when shipment becomes PICKED_UP
    if instance.status != 'PICKED_UP':
        return

    # Get the associated order
    order = instance.order
    if not order:
        return

    # Only process purchase orders (receiving inventory)
    if order.order_type != 'PURCHASE':
        return

    # Determine receiving location
    # For now, use staging_location or to_location from order
    receiving_location = instance.staging_location or order.to_location
    if not receiving_location:
        return  # Can't receive without a location

    # Process each line in the order
    for order_line in order.lines.all():
        # Skip lines without items
        if not order_line.item:
            continue

        # Create an inventory layer for this receipt
        InventoryLayer.objects.create(
            item=order_line.item,
            location=receiving_location,
            bin=instance.staging_bin or order_line.to_bin,  # Use staging bin or line's to_bin
            qty_remaining=order_line.qty,
            unit_cost=order_line.price_each or 0,
            received_at=instance.picked_up_at or timezone.now(),
            purchase_order=order,
            vendor=order.vendor,
            manufacturer=order_line.expected_manufacturer or '',
            manufacturer_part_no=order_line.expected_mfr_part_no or '',
            reference=f"Received from PO via Shipment {instance.shipment_id}"
        )

        # Update Item's current_replacement_cost with latest purchase price
        if order_line.price_each:
            order_line.item.update_replacement_cost(order_line.price_each)
