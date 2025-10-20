from django.contrib import admin
from .models import (
    User, OAuthIdentity, Role, Permission,
    RolePermission, UserRole, UserLocationAccess, UserDepartmentAccess
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'email', 'display_name', 'status', 'employee', 'last_login_at', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('email', 'display_name', 'employee__first_name', 'employee__last_name')
    readonly_fields = ('user_id', 'created_at')


@admin.register(OAuthIdentity)
class OAuthIdentityAdmin(admin.ModelAdmin):
    list_display = ('identity_id', 'user', 'provider', 'provider_email', 'linked_at')
    list_filter = ('provider', 'linked_at')
    search_fields = ('user__email', 'provider_email', 'provider_user_id')
    readonly_fields = ('identity_id', 'linked_at')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'name', 'description')
    search_fields = ('name', 'description')
    readonly_fields = ('role_id',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('permission_id', 'name', 'resource', 'action', 'description')
    list_filter = ('resource', 'action')
    search_fields = ('name', 'resource', 'action')
    readonly_fields = ('permission_id',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role',)
    search_fields = ('role__name', 'permission__name')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_at')
    list_filter = ('role', 'assigned_at')
    search_fields = ('user__email', 'role__name')
    readonly_fields = ('assigned_at',)


@admin.register(UserLocationAccess)
class UserLocationAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'location')
    list_filter = ('location',)
    search_fields = ('user__email', 'location__name')


@admin.register(UserDepartmentAccess)
class UserDepartmentAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'department')
    list_filter = ('department',)
    search_fields = ('user__email', 'department__name')