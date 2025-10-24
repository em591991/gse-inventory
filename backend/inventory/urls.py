# backend/inventory/urls.py
from django.urls import path
from . import api_views

app_name = 'inventory'

urlpatterns = [
    path('receive/', api_views.receive_inventory, name='receive_inventory'),
    path('available/<uuid:item_id>/<uuid:location_id>/', 
         api_views.get_available_quantity, 
         name='get_available_quantity'),
    path('layers/<uuid:item_id>/<uuid:location_id>/', 
         api_views.get_inventory_layers, 
         name='get_inventory_layers'),
    path('allocate/', api_views.allocate_inventory, name='allocate_inventory'),
    path('estimate-cost/', 
         api_views.estimate_allocation_cost, 
         name='estimate_allocation_cost'),
    path('pending-allocations/', 
         api_views.get_pending_allocations, 
         name='get_pending_allocations'),
    path('transfer/', api_views.transfer_inventory, name='transfer_inventory'),
]