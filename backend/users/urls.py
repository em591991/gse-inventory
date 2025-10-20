from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    RoleViewSet,
    PermissionViewSet,
    OAuthIdentityViewSet,
    UserRoleViewSet,
    UserLocationAccessViewSet,
    UserDepartmentAccessViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'oauth-identities', OAuthIdentityViewSet, basename='oauthidentity')
router.register(r'user-roles', UserRoleViewSet, basename='userrole')
router.register(r'user-location-access', UserLocationAccessViewSet, basename='userlocationaccess')
router.register(r'user-department-access', UserDepartmentAccessViewSet, basename='userdepartmentaccess')

urlpatterns = [
    path('', include(router.urls)),
]
