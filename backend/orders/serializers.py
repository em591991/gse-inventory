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
    # Nested object references with names
    vendor = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    from_location = serializers.SerializerMethodField()
    to_location = serializers.SerializerMethodField()
    assigned_user = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    # Computed fields
    line_count = serializers.SerializerMethodField()
    lines = OrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id',
            'order_type',
            'order_status',
            'ordered_at',
            'fulfillment_date',
            'description',
            'vendor',
            'customer',
            'job',
            'department',
            'from_location',
            'to_location',
            'assigned_user',
            'created_by',
            'line_count',
            'lines'
        ]
        read_only_fields = ['order_id', 'ordered_at']

    def get_vendor(self, obj):
        if obj.vendor:
            return {'vendor_id': str(obj.vendor.vendor_id), 'name': obj.vendor.name}
        return None

    def get_customer(self, obj):
        if obj.customer:
            return {'customer_id': str(obj.customer.customer_id), 'name': obj.customer.name}
        return None

    def get_job(self, obj):
        if obj.job:
            return {'job_id': str(obj.job.job_id), 'name': obj.job.name, 'job_code': obj.job.job_code}
        return None

    def get_from_location(self, obj):
        if obj.from_location:
            return {'location_id': str(obj.from_location.location_id), 'name': obj.from_location.name}
        return None

    def get_to_location(self, obj):
        if obj.to_location:
            return {'location_id': str(obj.to_location.location_id), 'name': obj.to_location.name}
        return None

    def get_assigned_user(self, obj):
        if obj.assigned_user:
            user = obj.assigned_user
            # Format as "F. Lastname" if employee info available
            if user.employee and user.employee.first_name and user.employee.last_name:
                name = f"{user.employee.first_name[0]}. {user.employee.last_name}"
            else:
                name = user.display_name or user.email
            return {'user_id': str(user.user_id), 'email': user.email, 'name': name}
        return None

    def get_department(self, obj):
        if obj.department:
            return {'department_id': str(obj.department.department_id), 'name': obj.department.name}
        return None

    def get_created_by(self, obj):
        if obj.created_by:
            user = obj.created_by
            # Format as "F. Lastname" if employee info available
            if user.employee and user.employee.first_name and user.employee.last_name:
                name = f"{user.employee.first_name[0]}. {user.employee.last_name}"
            else:
                name = user.display_name or user.email
            return {'user_id': str(user.user_id), 'email': user.email, 'name': name}
        return None

    def get_line_count(self, obj):
        return obj.lines.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Detailed Order serializer - includes nested lines and related info
    Use for retrieve/detail views
    """
    # Nested object references with names
    vendor = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    from_location = serializers.SerializerMethodField()
    to_location = serializers.SerializerMethodField()
    assigned_user = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    # Order lines
    lines = OrderLineSerializer(many=True, read_only=True)
    line_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id',
            'order_type',
            'order_status',
            'ordered_at',
            'fulfillment_date',
            'description',
            'work_order',
            'job',
            'customer',
            'vendor',
            'department',
            'from_location',
            'to_location',
            'assigned_user',
            'created_by',
            'line_count',
            'lines'
        ]
        read_only_fields = ['order_id', 'ordered_at']

    def get_vendor(self, obj):
        if obj.vendor:
            return {'vendor_id': str(obj.vendor.vendor_id), 'name': obj.vendor.name}
        return None

    def get_customer(self, obj):
        if obj.customer:
            return {'customer_id': str(obj.customer.customer_id), 'name': obj.customer.name}
        return None

    def get_job(self, obj):
        if obj.job:
            return {'job_id': str(obj.job.job_id), 'name': obj.job.name, 'job_code': obj.job.job_code}
        return None

    def get_from_location(self, obj):
        if obj.from_location:
            return {'location_id': str(obj.from_location.location_id), 'name': obj.from_location.name}
        return None

    def get_to_location(self, obj):
        if obj.to_location:
            return {'location_id': str(obj.to_location.location_id), 'name': obj.to_location.name}
        return None

    def get_assigned_user(self, obj):
        if obj.assigned_user:
            user = obj.assigned_user
            # Format as "F. Lastname" if employee info available
            if user.employee and user.employee.first_name and user.employee.last_name:
                name = f"{user.employee.first_name[0]}. {user.employee.last_name}"
            else:
                name = user.display_name or user.email
            return {'user_id': str(user.user_id), 'email': user.email, 'name': name}
        return None

    def get_department(self, obj):
        if obj.department:
            return {'department_id': str(obj.department.department_id), 'name': obj.department.name}
        return None

    def get_created_by(self, obj):
        if obj.created_by:
            user = obj.created_by
            # Format as "F. Lastname" if employee info available
            if user.employee and user.employee.first_name and user.employee.last_name:
                name = f"{user.employee.first_name[0]}. {user.employee.last_name}"
            else:
                name = user.display_name or user.email
            return {'user_id': str(user.user_id), 'email': user.email, 'name': name}
        return None

    def get_line_count(self, obj):
        return obj.lines.count()


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
            'fulfillment_date',
            'description',
            'work_order',
            'job',
            'customer',
            'vendor',
            'department',
            'from_location',
            'to_location',
            'assigned_user',
            'created_by',
            'order_lines'  # Nested lines
        ]
        read_only_fields = ['order_id', 'ordered_at', 'created_by']
    
    def create(self, validated_data):
        """
        Create order with nested order lines in a single transaction
        """
        # Extract nested lines data
        lines_data = validated_data.pop('lines', [])

        # Set created_by from request user if available
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['created_by'] = request.user

        # Auto-populate department from job if job is provided and department is not
        if validated_data.get('job') and not validated_data.get('department'):
            job = validated_data['job']
            if hasattr(job, 'customer') and hasattr(job.customer, 'department'):
                validated_data['department'] = job.customer.department

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