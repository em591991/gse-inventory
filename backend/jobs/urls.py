from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, JobViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'jobs', JobViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
