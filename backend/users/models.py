import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password


class UserManager(models.Manager):
    """Custom manager for User model"""

    def get_by_natural_key(self, email):
        """Get user by email (natural key)"""
        return self.get(email=email)

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Email must be set')
        email = email.lower().strip()  # Normalize email
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('status', 'ACTIVE')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


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
    password = models.CharField(max_length=255, blank=True, default='')  # Hashed password
    display_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.INVITED
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()  # Custom manager

    USERNAME_FIELD = 'email'  # Use email as the username
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='uq_users_email'),
            models.Index(fields=['employee'], name='idx_users_employee'),
        ]

    def __str__(self):
        return self.email

    def natural_key(self):
        """Return the natural key for this user (email)"""
        return (self.email,)

    @property
    def id(self):
        """Alias for user_id to work with Django's authentication system"""
        return self.user_id
    
    @property
    def pk(self):
        """Primary key property for Django compatibility"""
        return self.user_id
    
    @property
    def is_authenticated(self):
        """Always return True for authenticated users"""
        return True
    
    @property
    def is_anonymous(self):
        """Always return False for authenticated users"""
        return False

    def set_password(self, raw_password):
        """Set password - stores hashed version"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password)

    def has_perm(self, perm, obj=None):
        """Check if user has a specific permission (superuser has all)"""
        return self.is_superuser

    def has_module_perms(self, app_label):
        """Check if user has permissions to view the app (superuser has all)"""
        return self.is_superuser


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
        'locations.Location',
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


