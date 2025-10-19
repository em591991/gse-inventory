from django.contrib import admin
from .models import WorkOrder


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ("job", "title", "wo_number", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("job_number", "description")
