from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Sum, Count, F
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderLine
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-ordered_at')
    serializer_class = OrderSerializer

    # ✅ Filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'vendor']
    search_fields = ['vendor__name', 'order_items__item__name', 'status', 'notes']
    ordering_fields = ['ordered_at', 'status']
    ordering = ['-ordered_at']

    # ✅ Summary endpoint
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return summary stats for all orders"""
        data = Order.objects.aggregate(
            total_orders=Count('id'),
            pending_orders=Count('id', filter=models.Q(status='Pending')),
            completed_orders=Count('id', filter=models.Q(status='Completed')),
            total_value=Sum(F('order_items__total_price')),
        )
        return Response(data)
