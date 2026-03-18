from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["employee_id", "full_name", "email", "department", "created_at"]
    list_filter = ["department"]
    search_fields = ["employee_id", "full_name", "email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]
