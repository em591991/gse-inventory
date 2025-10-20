from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    User,
    OAuthIdentity,
    Role,
    Permission,
    UserRole,
    UserLocationAccess,
    UserDepartmentAccess
)
from .serializers import (
    UserSerializer,
    UserListSerializer,
    OAuthIdentitySerializer,
    RoleSerializer,
    PermissionSerializer,
    UserRoleSerializer,
    UserLocationAccessSerializer,
    UserDepartmentAccessSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User operations"""
    queryset = User.objects.all().select_related('employee').prefetch_related('roles')
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['email', 'display_name', 'employee__first_name', 'employee__last_name']
    ordering_fields = ['email', 'created_at', 'last_login_at']
    ordering = ['email']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user"""
        # TODO: Implement proper authentication
        # For now, return error
        return Response(
            {'error': 'Authentication not yet implemented'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Assign role to user"""
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        if not role_id:
            return Response(
                {'error': 'role_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role = Role.objects.get(role_id=role_id)
        except Role.DoesNotExist:
            return Response(
                {'error': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            role=role
        )
        
        if created:
            return Response(
                UserRoleSerializer(user_role).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'message': 'User already has this role'},
                status=status.HTTP_200_OK
            )


class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet for Role operations"""
    queryset = Role.objects.all().prefetch_related('permissions')
    serializer_class = RoleSerializer
    
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']


class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Permission operations"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['resource', 'action']
    search_fields = ['name', 'resource', 'action']


class OAuthIdentityViewSet(viewsets.ModelViewSet):
    """ViewSet for OAuthIdentity operations"""
    queryset = OAuthIdentity.objects.all().select_related('user')
    serializer_class = OAuthIdentitySerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'provider']


class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for UserRole operations"""
    queryset = UserRole.objects.all().select_related('user', 'role')
    serializer_class = UserRoleSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'role']


class UserLocationAccessViewSet(viewsets.ModelViewSet):
    """ViewSet for UserLocationAccess operations"""
    queryset = UserLocationAccess.objects.all().select_related('user', 'location')
    serializer_class = UserLocationAccessSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'location']


class UserDepartmentAccessViewSet(viewsets.ModelViewSet):
    """ViewSet for UserDepartmentAccess operations"""
    queryset = UserDepartmentAccess.objects.all().select_related('user', 'department')
    serializer_class = UserDepartmentAccessSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'department']