from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DepartmentAssignmentViewSet

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet)
router.register(r"department_assignments", DepartmentAssignmentViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
