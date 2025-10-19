from rest_framework import serializers
from vendors.models import Vendor
from inventory.models import Item, UnitOfMeasure
from .models import VendorItem


class VendorItemSerializer(serializers.ModelSerializer):
    vendor = serializers.SlugRelatedField(
        queryset=Vendor.objects.all(),
        slug_field="name",   # Use 'name' of the vendor
        required=True,
        label="Vendor"
)
    item = serializers.SlugRelatedField(
        queryset=Item.objects.all(),
        slug_field="name",   # Use 'name' of the item
        required=True,
        label="Item"
)
    vendor_uom = serializers.SlugRelatedField(
        queryset=UnitOfMeasure.objects.all(),
        slug_field="uom_code",  # Use 'uom_code' of the Unit of Measure
        required=True,
        label="Unit of Measure"
)



    # Optional readable extras
    vendor_name = serializers.CharField(source="vendor.name", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    vendor_uom_code = serializers.CharField(source="vendor_uom.uom_code", read_only=True)

    class Meta:
        model = VendorItem
        fields = [
            "id",
            "vendor",
            "vendor_name",
            "item",
            "item_name",
            "vendor_sku",
            "vendor_uom",
            "vendor_uom_code",
            "price",
            "conversion_factor",
            "lead_time_days",
            "last_updated",
        ]
