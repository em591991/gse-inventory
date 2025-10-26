# backend/orders/views.py
"""
ViewSets for Orders REST API
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderLine
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
    OrderLineSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing orders
    
    Provides CRUD operations and filtering
    """
    queryset = Order.objects.all().select_related(
        'customer', 'vendor', 'job', 'work_order'
    ).prefetch_related('lines')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['order_type', 'order_status', 'customer', 'vendor']
    search_fields = ['notes', 'customer__name', 'vendor__name']
    ordering_fields = ['ordered_at', 'order_status']
    ordering = ['-ordered_at']  # Default: newest first
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return OrderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OrderCreateSerializer
        return OrderDetailSerializer
    
    @action(detail=True, methods=['get'])
    def lines(self, request, pk=None):
        """Get all lines for an order"""
        order = self.get_object()
        lines = order.lines.all().order_by('line_no')
        serializer = OrderLineSerializer(lines, many=True)
        return Response(serializer.data)


class OrderLineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing order lines
    """
    queryset = OrderLine.objects.all().select_related('order', 'item', 'uom')
    serializer_class = OrderLineSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['order', 'item']
    ordering_fields = ['line_no']
    ordering = ['line_no']