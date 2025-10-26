# backend/orders/serializers.py
"""
Serializers for Orders REST API
"""
from rest_framework import serializers
from .models import Order, OrderLine, SalesOrderInfo


class OrderLineSerializer(serializers.ModelSerializer):
    """Serializer for OrderLine - handles both read and write"""
    
    class Meta:
        model = OrderLine
        fields = [
            'order_line_id',
            'line_no',
            'item',
            'purchase_category',
            'description',
            'uom',
            'qty',
            'price_each',
            'from_bin',
            'to_bin',
            'g_code',
            'notes'
        ]
        read_only_fields = ['order_line_id']


class OrderListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views
    Shows summary info without nested lines
    """
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, allow_null=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    job_code = serializers.CharField(source='job.job_code', read_only=True, allow_null=True)
    line_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'order_id',
            'order_type',
            'order_status',
            'ordered_at',
            'vendor_name',
            'customer_name',
            'job_code',
            'line_count',
            'total_amount',
            'notes'
        ]
        read_only_fields = ['order_id', 'ordered_at']
    
    def get_line_count(self, obj):
        return obj.lines.count()
    
    def get_total_amount(self, obj):
        try:
            return obj.get_total_amount()
        except:
            return 0


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Detailed Order serializer - includes nested lines and related info
    Use for retrieve/detail views
    """
    order_lines = OrderLineSerializer(many=True, read_only=True, source='lines')
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, allow_null=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    job_code = serializers.CharField(source='job.job_code', read_only=True, allow_null=True)
    line_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'order_id',
            'order_type',
            'order_status',
            'ordered_at',
            'notes',
            'work_order',
            'job',
            'job_code',
            'customer',
            'customer_name',
            'vendor',
            'vendor_name',
            'from_location',
            'to_location',
            'line_count',
            'total_amount',
            'order_lines'
        ]
        read_only_fields = ['order_id', 'ordered_at']
    
    def get_line_count(self, obj):
        return obj.lines.count()
    
    def get_total_amount(self, obj):
        try:
            return obj.get_total_amount()
        except:
            return 0


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating orders
    Accepts nested order_lines in a single request
    """
    order_lines = OrderLineSerializer(many=True, required=False, source='lines')
    
    class Meta:
        model = Order
        fields = [
            'order_id',
            'order_type',
            'order_status',
            'ordered_at',
            'notes',
            'work_order',
            'job',
            'customer',
            'vendor',
            'from_location',
            'to_location',
            'order_lines'  # Nested lines
        ]
        read_only_fields = ['order_id', 'ordered_at']
    
    def create(self, validated_data):
        """
        Create order with nested order lines in a single transaction
        """
        # Extract nested lines data
        lines_data = validated_data.pop('lines', [])
        
        # Create the order first
        order = Order.objects.create(**validated_data)
        
        # Create all order lines
        for line_data in lines_data:
            OrderLine.objects.create(order=order, **line_data)
        
        return order
    
    def update(self, instance, validated_data):
        """
        Update order and optionally update lines
        """
        # Extract nested lines data if present
        lines_data = validated_data.pop('lines', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # If lines data provided, update them
        if lines_data is not None:
            # Simple approach: delete existing lines and recreate
            # (For production, consider more sophisticated partial update)
            instance.lines.all().delete()
            for line_data in lines_data:
                OrderLine.objects.create(order=instance, **line_data)
        
        return instance


class SalesOrderInfoSerializer(serializers.ModelSerializer):
    """Serializer for SalesOrderInfo model"""
    
    class Meta:
        model = SalesOrderInfo
        fields = [
            'order',
            'ship_to_name',
            'ship_to_address',
            'ship_to_city',
            'ship_to_state',
            'ship_to_postal',
            'contact_name',
            'contact_phone',
            'contact_email'
        ]


# Backwards compatibility aliases
OrderSummarySerializer = OrderListSerializer
OrderSerializer = OrderCreateSerializer  # Default to create serializer