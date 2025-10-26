from django.shortcuts import render

# Create your views here.
# locations/views.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Locations
    
    list: Get all locations
    create: Create a new location
    retrieve: Get a specific location
    update: Update a location
    partial_update: Partially update a location
    destroy: Delete a location
    """
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer
    
    # Enable filtering, searching, ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'type']
    ordering_fields = ['name', 'type']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Optionally filter locations by active status
        """
        queryset = Location.objects.all()
        
        # Filter by active status if provided
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('name')