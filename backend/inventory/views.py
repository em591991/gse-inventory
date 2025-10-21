from rest_framework import viewsets
from .models import Item, UnitOfMeasure, Location, Bin, InventoryMovement
from .serializers import ItemSerializer, UnitOfMeasureSerializer, VendorItemSerializer
from vendoritems.models import VendorItem
from .serializers import LocationSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


class UnitOfMeasureViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer


class VendorItemViewSet(viewsets.ModelViewSet):
    queryset = VendorItem.objects.all().select_related('vendor', 'vendor_uom', 'item')
    serializer_class = VendorItemSerializer

class LocationViewSet(viewsets.ModelViewSet):
    """API endpoint for locations"""
    queryset = Location.objects.all()
    serializer_class = LocationSerializer