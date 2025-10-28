# backend/rfqs/serializers.py
"""
Serializers for RFQ REST API
"""
from rest_framework import serializers
from .models import (
    RFQ, RFQLine, RFQVendor, VendorQuote,
    ReplenishmentOrder, ReplenishmentLine
)


class RFQLineSerializer(serializers.ModelSerializer):
    """Serializer for RFQ Line items"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_g_code = serializers.CharField(source='item.g_code', read_only=True)
    uom_code = serializers.CharField(source='uom.uom_code', read_only=True)

    class Meta:
        model = RFQLine
        fields = [
            'rfq_line_id',
            'rfq',
            'line_no',
            'item',
            'item_name',
            'item_g_code',
            'qty_requested',
            'uom',
            'uom_code',
            'notes',
        ]
        read_only_fields = ['rfq_line_id']


class RFQVendorSerializer(serializers.ModelSerializer):
    """Serializer for RFQ Vendor associations"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = RFQVendor
        fields = [
            'rfq_vendor_id',
            'rfq',
            'vendor',
            'vendor_name',
            'status',
            'sent_at',
            'responded_at',
            'contact_email',
            'contact_name',
        ]
        read_only_fields = ['rfq_vendor_id']


class VendorQuoteSerializer(serializers.ModelSerializer):
    """Serializer for Vendor Quotes"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    item_name = serializers.CharField(source='rfq_line.item.name', read_only=True)
    item_g_code = serializers.CharField(source='rfq_line.item.g_code', read_only=True)

    class Meta:
        model = VendorQuote
        fields = [
            'quote_id',
            'rfq_line',
            'vendor',
            'vendor_name',
            'item_name',
            'item_g_code',
            'vendor_item',
            'price_each',
            'qty_available',
            'lead_time_days',
            'manufacturer',
            'manufacturer_part_number',
            'vendor_part_number',
            'quoted_at',
            'valid_until',
            'notes',
            'is_selected',
        ]
        read_only_fields = ['quote_id', 'quoted_at']


class RFQListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for RFQ list view"""
    created_by_name = serializers.SerializerMethodField()
    line_count = serializers.SerializerMethodField()
    vendor_count = serializers.SerializerMethodField()
    quote_count = serializers.SerializerMethodField()

    class Meta:
        model = RFQ
        fields = [
            'rfq_id',
            'rfq_number',
            'description',
            'status',
            'created_at',
            'sent_at',
            'quote_deadline',
            'created_by',
            'created_by_name',
            'line_count',
            'vendor_count',
            'quote_count',
        ]
        read_only_fields = ['rfq_id', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by and obj.created_by.employee:
            emp = obj.created_by.employee
            if emp.first_name and emp.last_name:
                return f"{emp.first_name[0]}. {emp.last_name}"
        return obj.created_by.display_name if obj.created_by else None

    def get_line_count(self, obj):
        return obj.lines.count()

    def get_vendor_count(self, obj):
        return obj.rfq_vendors.count()

    def get_quote_count(self, obj):
        """Count of quotes received across all lines"""
        return VendorQuote.objects.filter(rfq_line__rfq=obj).count()


class RFQDetailSerializer(serializers.ModelSerializer):
    """Detailed RFQ serializer with nested lines and vendors"""
    lines = RFQLineSerializer(many=True, read_only=True)
    rfq_vendors = RFQVendorSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RFQ
        fields = [
            'rfq_id',
            'rfq_number',
            'description',
            'status',
            'created_at',
            'sent_at',
            'quote_deadline',
            'created_by',
            'created_by_name',
            'lines',
            'rfq_vendors',
        ]
        read_only_fields = ['rfq_id', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by and obj.created_by.employee:
            emp = obj.created_by.employee
            if emp.first_name and emp.last_name:
                return f"{emp.first_name[0]}. {emp.last_name}"
        return obj.created_by.display_name if obj.created_by else None


class RFQCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating RFQs with nested lines and vendors"""
    lines = RFQLineSerializer(many=True)
    vendor_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text='List of vendor IDs to send RFQ to'
    )

    class Meta:
        model = RFQ
        fields = [
            'rfq_id',
            'rfq_number',
            'description',
            'status',
            'quote_deadline',
            'created_by',
            'lines',
            'vendor_ids',
        ]
        read_only_fields = ['rfq_id', 'created_by']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        vendor_ids = validated_data.pop('vendor_ids', [])

        # Set created_by from request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user

        # Create RFQ
        rfq = RFQ.objects.create(**validated_data)

        # Create lines
        for idx, line_data in enumerate(lines_data, start=1):
            line_data['line_no'] = idx
            RFQLine.objects.create(rfq=rfq, **line_data)

        # Create vendor associations
        from vendors.models import Vendor
        for vendor_id in vendor_ids:
            vendor = Vendor.objects.get(vendor_id=vendor_id)
            RFQVendor.objects.create(
                rfq=rfq,
                vendor=vendor,
                contact_email=vendor.email or '',
                contact_name=vendor.contact_name or ''
            )

        return rfq


class ReplenishmentLineSerializer(serializers.ModelSerializer):
    """Serializer for Replenishment Lines"""
    item_name = serializers.CharField(source='rfq_line.item.name', read_only=True)
    item_g_code = serializers.CharField(source='rfq_line.item.g_code', read_only=True)
    vendor_name = serializers.CharField(source='selected_vendor_quote.vendor.name', read_only=True)
    price_each = serializers.DecimalField(
        source='selected_vendor_quote.price_each',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = ReplenishmentLine
        fields = [
            'replenishment_line_id',
            'replenishment',
            'rfq_line',
            'item_name',
            'item_g_code',
            'selected_vendor_quote',
            'vendor_name',
            'price_each',
            'qty_to_order',
            'purchase_order',
        ]
        read_only_fields = ['replenishment_line_id', 'purchase_order']


class ReplenishmentOrderSerializer(serializers.ModelSerializer):
    """Serializer for Replenishment Orders"""
    lines = ReplenishmentLineSerializer(many=True, read_only=True)
    rfq_number = serializers.CharField(source='rfq.rfq_number', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReplenishmentOrder
        fields = [
            'replenishment_id',
            'rfq',
            'rfq_number',
            'status',
            'created_at',
            'finalized_at',
            'created_by',
            'created_by_name',
            'lines',
        ]
        read_only_fields = ['replenishment_id', 'created_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by and obj.created_by.employee:
            emp = obj.created_by.employee
            if emp.first_name and emp.last_name:
                return f"{emp.first_name[0]}. {emp.last_name}"
        return obj.created_by.display_name if obj.created_by else None
