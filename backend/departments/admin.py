
from django.contrib import admin
from .models import Department, DepartmentAssignment


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    search_fields = ('name', 'code')



@admin.register(DepartmentAssignment)
class DepartmentAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'department', 'start_date', 'end_date')
    list_filter = ('department',)
    search_fields = ('employee__first_name', 'employee__last_name', 'department__name')

