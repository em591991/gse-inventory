from rest_framework import serializers
from vendoritems.models import VendorItem
from .models import (
    Item,
    UnitOfMeasure,
    InventoryMovement,
    ItemLocationPolicy,
)
from vendors.serializers import VendorSerializer



class UnitOfMeasureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = ['uom_code', 'description']


class VendorItemSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_uom = UnitOfMeasureSerializer(read_only=True)

    class Meta:
        model = VendorItem
        fields = [
            'id',
            'vendor',
            'vendor_sku',
            'price',
            'vendor_uom',
            'conversion_factor',
            'lead_time_days'
        ]


class ItemSerializer(serializers.ModelSerializer):
    default_uom = UnitOfMeasureSerializer(read_only=True)
    vendor_items = VendorItemSerializer(
        source='vendoritem_set', many=True, read_only=True
    )

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'description', 'sku',
            'category', 'manufacturer',
            'default_uom', 'vendor_items'
        ]


class InventoryMovementSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    uom = UnitOfMeasureSerializer(read_only=True)
    from_location = serializers.StringRelatedField()
    to_location = serializers.StringRelatedField()

    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'item', 'qty', 'uom', 'moved_at',
            'from_location', 'from_bin',
            'to_location', 'to_bin',
            'note'
        ]

class ItemLocationPolicySerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    location = serializers.StringRelatedField()
    preferred_vendor = VendorSerializer(read_only=True)

    class Meta:
        model = ItemLocationPolicy
        fields = [
            'id', 'item', 'location',
            'min_qty', 'max_qty', 'reorder_qty',
            'lead_time_days', 'preferred_vendor'
        ]
