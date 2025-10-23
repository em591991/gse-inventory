from django.urls import path, include
from rest_framework.routers import DefaultRouter
from vendoritems.views import VendorItemListCreateView
from . import api_views
from .views import (
    ItemViewSet,
    UnitOfMeasureViewSet,
    InventoryMovementViewSet,
    ItemLocationPolicyViewSet,
    )

router = DefaultRouter()
router.register(r'items', ItemViewSet)
router.register(r'units', UnitOfMeasureViewSet)
router.register(r'movements', InventoryMovementViewSet, basename='movement')
router.register(r'item-policies', ItemLocationPolicyViewSet, basename='itempolicy')

urlpatterns = [
    path('', include(router.urls)),
    path('vendoritems/', VendorItemListCreateView.as_view(), name='vendoritem-list-create'),
    path('inventory/', include(router.urls)),
]

app_name = 'inventory'

urlpatterns = [
    # Receive inventory
    path('receive/', api_views.receive_inventory, name='receive_inventory'),
    
    # Get available quantity
    path('available/<uuid:item_id>/<uuid:location_id>/', 
         api_views.get_available_quantity, 
         name='get_available_quantity'),
    
    # Get inventory layers (FIFO breakdown)
    path('layers/<uuid:item_id>/<uuid:location_id>/', 
         api_views.get_inventory_layers, 
         name='get_inventory_layers'),
    
    # Allocate inventory
    path('allocate/', api_views.allocate_inventory, name='allocate_inventory'),
    
    # Estimate allocation cost (preview)
    path('estimate-cost/', 
         api_views.estimate_allocation_cost, 
         name='estimate_allocation_cost'),
    
    # Get pending allocations (negative inventory)
    path('pending-allocations/', 
         api_views.get_pending_allocations, 
         name='get_pending_allocations'),
    
    # Transfer inventory between locations
    path('transfer/', api_views.transfer_inventory, name='transfer_inventory'),
]






