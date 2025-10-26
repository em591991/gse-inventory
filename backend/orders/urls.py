# backend/orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views
from .views import OrderViewSet, OrderLineViewSet

app_name = 'orders'

# REST API router
router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')
router.register(r'lines', OrderLineViewSet, basename='orderline')

urlpatterns = [
    # REST API endpoints (NO 'api/' prefix here!)
    path('', include(router.urls)),
    
    # Pick ticket download (custom endpoint)
    path('<uuid:order_id>/pick-ticket/', 
         api_views.download_pick_ticket, 
         name='download_pick_ticket'),
]