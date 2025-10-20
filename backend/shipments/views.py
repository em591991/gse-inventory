from django.shortcuts import render

# Create your views here.
# backend/shipments/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Shipment, ShipmentLine
from .serializers import (
    ShipmentSerializer,
    ShipmentListSerializer,
    ShipmentCreateSerializer,
    ShipmentLineSerializer
)


class ShipmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Shipment operations
    
    Provides:
    - list: Get all shipments
    - retrieve: Get single shipment with lines
    - create: Create new shipment with lines
    - update: Update shipment
    - destroy: Delete shipment
    - stage: Mark shipment as staged
    - pickup: Mark shipment as picked up
    """
    queryset = Shipment.objects.all().select_related(
        'order',
        'staging_location',
        'staging_bin'
    ).prefetch_related('lines')
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'order', 'staging_location']
    search_fields = ['shipment_id', 'order__order_id', 'notes']
    ordering_fields = ['created_at', 'staged_at', 'picked_up_at', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        elif self.action == 'create':
            return ShipmentCreateSerializer
        return ShipmentSerializer
    
    @action(detail=True, methods=['post'])
    def stage(self, request, pk=None):
        """Mark shipment as staged"""
        shipment = self.get_object()
        
        if shipment.status != 'PICKING':
            return Response(
                {'error': 'Can only stage shipments in PICKING status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        shipment.status = 'STAGED'
        from django.utils import timezone
        shipment.staged_at = timezone.now()
        shipment.save()
        
        serializer = self.get_serializer(shipment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def pickup(self, request, pk=None):
        """Mark shipment as picked up"""
        shipment = self.get_object()
        
        if shipment.status != 'STAGED':
            return Response(
                {'error': 'Can only mark as picked up when status is STAGED'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        shipment.status = 'PICKED_UP'
        from django.utils import timezone
        shipment.picked_up_at = timezone.now()
        shipment.save()
        
        serializer = self.get_serializer(shipment)
        return Response(serializer.data)


class ShipmentLineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ShipmentLine operations
    """
    queryset = ShipmentLine.objects.all().select_related(
        'shipment',
        'order_line'
    )
    serializer_class = ShipmentLineSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['shipment', 'order_line']
    search_fields = ['shipment_line_id', 'notes']