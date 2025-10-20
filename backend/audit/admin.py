from django.contrib import admin
from audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('log_id', 'timestamp', 'user', 'action', 'entity_type', 'entity_id', 'ip')
    list_filter = ('action', 'entity_type', 'timestamp')
    search_fields = ('user__email', 'action', 'entity_type', 'entity_id', 'details')
    readonly_fields = ('log_id', 'timestamp', 'user', 'action', 'entity_type', 'entity_id', 'details', 'ip')
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
