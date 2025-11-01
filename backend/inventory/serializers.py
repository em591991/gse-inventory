# backend/inventory/serializers.py
from rest_framework import serializers
from .models import (
    Item,
    UnitOfMeasure,
    InventoryMovement,
    ItemLocationPolicy,
)


class UnitOfMeasureSerializer(serializers.ModelSerializer):
    """
    Serializer for UnitOfMeasure.
    CRITICAL: Primary key is 'uom_code' (CharField), NOT 'uom_id'.
    """
    class Meta:
        model = UnitOfMeasure
        fields = [
            'uom_code',      # ✅ This is the PK - NOT 'uom_id'
            'description'
        ]

class ItemSerializer(serializers.ModelSerializer):
    """Serializer for Item model - matches ERD field names"""

    # Include UOM details
    default_uom_code = serializers.CharField(source='default_uom.uom_code', read_only=True)

    class Meta:
        model = Item
        fields = [
            'item_id',
            'g_code',
            'item_name',
            'description',
            'category',
            'subcategory',
            'subcategory2',
            'subcategory3',
            'manufacturer',
            'manufacturer_part_no',
            'default_uom',
            'default_uom_code',
        ]
        read_only_fields = ['item_id']


class InventoryMovementSerializer(serializers.ModelSerializer):
    # Include related object details for display
    item_g_code = serializers.CharField(source='item.g_code', read_only=True)
    item_name = serializers.CharField(source='item.item_name', read_only=True)
    uom_code = serializers.CharField(source='uom.uom_code', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            'movement_id',
            'item',
            'item_g_code',
            'item_name',
            'qty',
            'uom',
            'uom_code',
            'moved_at',
            'from_location',
            'from_location_name',
            'from_bin',
            'to_location',
            'to_location_name',
            'to_bin',
            'note'
        ]
        read_only_fields = ['movement_id', 'moved_at']


class ItemLocationPolicySerializer(serializers.ModelSerializer):
    item_g_code = serializers.CharField(source='item.g_code', read_only=True)
    item_name = serializers.CharField(source='item.item_name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    preferred_vendor_name = serializers.CharField(source='preferred_vendor.name', read_only=True)

    class Meta:
        model = ItemLocationPolicy
        fields = [
            'policy_id',
            'item',
            'item_g_code',
            'item_name',
            'location',
            'location_name',
            'min_qty',
            'max_qty',
            'reorder_qty',
            'lead_time_days',
            'preferred_vendor',
            'preferred_vendor_name'
        ]
        read_only_fields = ['policy_id']