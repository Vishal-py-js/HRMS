from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["employee", "date", "status", "notes", "created_at"]
    list_filter = ["status", "date", "employee__department"]
    search_fields = ["employee__full_name", "employee__employee_id"]
    ordering = ["-date"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["employee"]
