import uuid
from django.db import models
from django.utils import timezone


class UserStatus(models.TextChoices):
    """ERD enum: user_status"""
    ACTIVE = 'ACTIVE', 'Active'
    INVITED = 'INVITED', 'Invited'
    DISABLED = 'DISABLED', 'Disabled'


class RoleName(models.TextChoices):
    """ERD enum: role_name"""
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Manager'
    WAREHOUSE = 'WAREHOUSE', 'Warehouse'
    SALES = 'SALES', 'Sales'
    VIEWER = 'VIEWER', 'Viewer'


class User(models.Model):
    """
    ERD Table: users
    System users with authentication
    """
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='employee_id',
        related_name='user_accounts'
    )
    email = models.EmailField(max_length=320, unique=True)
    display_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.INVITED
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='uq_users_email'),
            models.Index(fields=['employee'], name='idx_users_employee'),
        ]

    def __str__(self):
        return self.email


class OAuthIdentity(models.Model):
    """
    ERD Table: oauth_identities
    OAuth provider identities linked to users
    """
    identity_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='oauth_identities'
    )
    provider = models.CharField(max_length=80)
    provider_user_id = models.CharField(max_length=255)
    provider_email = models.EmailField(max_length=320, blank=True)
    linked_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'oauth_identities'
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'provider_user_id'],
                name='uq_oauth_provider_user'
            )
        ]
        indexes = [
            models.Index(fields=['user'], name='idx_oauth_user'),
            models.Index(fields=['provider', 'provider_user_id'], name='idx_oauth_lookup'),
        ]

    def __str__(self):
        return f"{self.provider} - {self.provider_email}"


class Role(models.Model):
    """
    ERD Table: roles
    Defines user roles/groups
    """
    role_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=80,
        choices=RoleName.choices,
        unique=True
    )
    description = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'roles'
        indexes = [
            models.Index(fields=['name'], name='uq_role_name'),
        ]

    def __str__(self):
        return self.get_name_display()


class Permission(models.Model):
    """
    ERD Table: permissions
    Granular permissions for actions/resources
    """
    permission_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    resource = models.CharField(max_length=80)
    action = models.CharField(max_length=40)
    description = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'permissions'
        constraints = [
            models.UniqueConstraint(
                fields=['resource', 'action'],
                name='uq_permission_resource_action'
            )
        ]
        indexes = [
            models.Index(fields=['name'], name='uq_perm_name'),
            models.Index(fields=['resource', 'action'], name='idx_perm_resource_action'),
        ]

    def __str__(self):
        return f"{self.resource}:{self.action}"


class RolePermission(models.Model):
    """
    ERD Table: role_permissions
    Links roles to permissions (many-to-many)
    """
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column='role_id',
        related_name='permissions'
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        db_column='permission_id',
        related_name='roles'
    )

    class Meta:
        db_table = 'role_permissions'
        constraints = [
            models.UniqueConstraint(
                fields=['role', 'permission'],
                name='pk_role_perm'
            )
        ]
        indexes = [
            models.Index(fields=['role'], name='idx_role_perm_role'),
            models.Index(fields=['permission'], name='idx_role_perm_perm'),
        ]

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


class UserRole(models.Model):
    """
    ERD Table: user_roles
    Assigns roles to users (many-to-many)
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column='role_id',
        related_name='users'
    )
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'user_roles'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'role'],
                name='pk_user_role'
            )
        ]
        indexes = [
            models.Index(fields=['user'], name='idx_user_role_user'),
            models.Index(fields=['role'], name='idx_user_role_role'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


class UserLocationAccess(models.Model):
    """
    ERD Table: user_location_access
    Restricts users to specific locations
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='location_access'
    )
    location = models.ForeignKey(
        'inventory.Location',
        on_delete=models.CASCADE,
        db_column='location_id',
        related_name='user_access'
    )

    class Meta:
        db_table = 'user_location_access'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'location'],
                name='pk_user_loc'
            )
        ]
        indexes = [
            models.Index(fields=['user'], name='idx_user_loc_user'),
            models.Index(fields=['location'], name='idx_user_loc_location'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.location}"


class UserDepartmentAccess(models.Model):
    """
    ERD Table: user_department_access
    Restricts users to specific departments
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='department_access'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        db_column='department_id',
        related_name='user_access'
    )

    class Meta:
        db_table = 'user_department_access'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'department'],
                name='pk_user_dept'
            )
        ]
        indexes = [
            models.Index(fields=['user'], name='idx_user_dept_user'),
            models.Index(fields=['department'], name='idx_user_dept_department'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.department}"

