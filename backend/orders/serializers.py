from rest_framework import serializers
from .models import Order, OrderItem
from inventory.serializers import ItemSerializer
from vendors.serializers import VendorSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=OrderItem._meta.get_field('item').remote_field.model.objects.all(),
        source='item',
        write_only=True
    )
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=OrderItem._meta.get_field('order').remote_field.model.objects.all(),
        source='order',
        write_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order_id', 'item_id', 'item',
            'quantity', 'unit_price', 'total_price'
        ]
        read_only_fields = ['unit_price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'vendor', 'status', 'created_at', 'notes', 'order_items']

class OrderSummarySerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'vendor_name', 'status', 'total_items', 'total_cost']

    def get_total_items(self, obj):
        return obj.order_items.count()

    def get_total_cost(self, obj):
        return sum((item.total_price or 0) for item in obj.order_items.all())
