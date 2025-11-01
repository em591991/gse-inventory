from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Item, UnitOfMeasure, Location, Bin, InventoryMovement
from .serializers import ItemSerializer, UnitOfMeasureSerializer
from vendoritems.models import VendorItem


class ItemPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 10000


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    pagination_class = ItemPagination


class UnitOfMeasureViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer


