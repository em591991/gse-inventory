from rest_framework.routers import DefaultRouter
from .views import SubcontractorViewSet

router = DefaultRouter()
router.register(r"subcontractors", SubcontractorViewSet, basename="subcontractor")

urlpatterns = router.urls
