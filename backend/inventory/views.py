from rest_framework import viewsets
from .models import Item, UnitOfMeasure, Location, Bin, InventoryMovement
from .serializers import ItemSerializer, UnitOfMeasureSerializer
from vendoritems.models import VendorItem



class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


class UnitOfMeasureViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer


