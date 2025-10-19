from django.contrib import admin
from .models import Customer, Job

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'terms')
    search_fields = ('name', 'email')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('job_code', 'name', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('job_code', 'name')
