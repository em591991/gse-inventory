from rest_framework import serializers
from .models import (
    User,
    OAuthIdentity,
    Role,
    Permission,
    RolePermission,
    UserRole,
    UserLocationAccess,
    UserDepartmentAccess
)


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission"""
    
    class Meta:
        model = Permission
        fields = [
            'permission_id',
            'name',
            'resource',
            'action',
            'description'
        ]
        read_only_fields = ['permission_id']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role with permissions"""
    permissions = PermissionSerializer(many=True, read_only=True, source='permissions.all')
    
    class Meta:
        model = Role
        fields = [
            'role_id',
            'name',
            'description',
            'permissions'
        ]
        read_only_fields = ['role_id']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User with roles"""
    roles = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'user_id',
            'employee',
            'employee_name',
            'email',
            'display_name',
            'status',
            'last_login_at',
            'created_at',
            'roles'
        ]
        read_only_fields = ['user_id', 'created_at']
    
    def get_roles(self, obj):
        role_names = obj.roles.values_list('role__name', flat=True)
        return list(role_names)
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    
    class Meta:
        model = User
        fields = [
            'user_id',
            'email',
            'display_name',
            'status',
            'last_login_at'
        ]
        read_only_fields = ['user_id']


class OAuthIdentitySerializer(serializers.ModelSerializer):
    """Serializer for OAuthIdentity"""
    
    class Meta:
        model = OAuthIdentity
        fields = [
            'identity_id',
            'user',
            'provider',
            'provider_user_id',
            'provider_email',
            'linked_at'
        ]
        read_only_fields = ['identity_id', 'linked_at']


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for UserRole"""
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'user',
            'role',
            'role_name',
            'assigned_at'
        ]
        read_only_fields = ['assigned_at']


class UserLocationAccessSerializer(serializers.ModelSerializer):
    """Serializer for UserLocationAccess"""
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = UserLocationAccess
        fields = [
            'user',
            'location',
            'location_name'
        ]


class UserDepartmentAccessSerializer(serializers.ModelSerializer):
    """Serializer for UserDepartmentAccess"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = UserDepartmentAccess
        fields = [
            'user',
            'department',
            'department_name'
        ]