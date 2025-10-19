from rest_framework import serializers
from .models import Vendor
from vendoritems.models import VendorItem


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'email', 'phone', 'address']


class VendorItemSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)

    class Meta:
        model = VendorItem
        fields = ['id', 'vendor', 'vendor_sku', 'price', 'lead_time_days']

class VendorItemNestedSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_sku = serializers.CharField(source="item.sku", read_only=True)

    class Meta:
        model = VendorItem
        fields = ["id", "item_name", "item_sku", "price", "lead_time_days", "last_updated"]

class VendorDetailSerializer(serializers.ModelSerializer):
    vendor_items = VendorItemNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Vendor
        fields = ["id", "name", "contact_name", "email", "phone", "address", "vendor_items"]
