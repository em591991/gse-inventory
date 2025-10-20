# backend/shipments/serializers.py

from rest_framework import serializers
from .models import Shipment, ShipmentLine


class ShipmentLineSerializer(serializers.ModelSerializer):
    """Serializer for ShipmentLine model"""
    
    class Meta:
        model = ShipmentLine
        fields = [
            'shipment_line_id',
            'shipment',
            'order_line',
            'qty_to_ship',
            'qty_picked',
            'notes'
        ]
        read_only_fields = ['shipment_line_id']


class ShipmentSerializer(serializers.ModelSerializer):
    """Serializer for Shipment model with nested lines"""
    lines = ShipmentLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = Shipment
        fields = [
            'shipment_id',
            'order',
            'staging_location',
            'staging_bin',
            'status',
            'created_at',
            'staged_at',
            'picked_up_at',
            'notes',
            'lines'
        ]
        read_only_fields = ['shipment_id', 'created_at']


class ShipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    line_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shipment
        fields = [
            'shipment_id',
            'order_id',
            'status',
            'created_at',
            'staged_at',
            'picked_up_at',
            'line_count'
        ]
        read_only_fields = ['shipment_id', 'created_at']
    
    def get_line_count(self, obj):
        return obj.lines.count()


class ShipmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shipments with lines"""
    lines = ShipmentLineSerializer(many=True)
    
    class Meta:
        model = Shipment
        fields = [
            'order',
            'staging_location',
            'staging_bin',
            'notes',
            'lines'
        ]
    
    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        shipment = Shipment.objects.create(**validated_data)
        
        for line_data in lines_data:
            ShipmentLine.objects.create(shipment=shipment, **line_data)
        
        return shipment