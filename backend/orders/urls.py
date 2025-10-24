from rest_framework.routers import DefaultRouter
from .views import OrderViewSet
from django.urls import path
from . import api_views

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = router.urls

app_name = 'orders'

urlpatterns = [
    # Pick ticket download
    path('<uuid:order_id>/pick-ticket/', 
         api_views.download_pick_ticket, 
         name='download_pick_ticket'),
]






























