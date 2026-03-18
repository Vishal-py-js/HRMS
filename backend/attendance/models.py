import uuid
from django.db import models
from employees.models import Employee


class AttendanceStatus(models.TextChoices):
    PRESENT = "Present", "Present"
    ABSENT = "Absent", "Absent"


class Attendance(models.Model):
    """
    Daily attendance record for an employee.

    Key design decisions:
    - Composite unique constraint on (employee, date) prevents double-marking
    - ForeignKey with on_delete=CASCADE ensures clean data when employee deleted
    - Separate indexes on date and status support common filter queries
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance",
        db_index=True,
    )
    date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        db_index=True,
    )
    notes = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance"
        ordering = ["-date", "employee__full_name"]
        constraints = [
            # Database-level guarantee: one attendance record per employee per day
            models.UniqueConstraint(
                fields=["employee", "date"],
                name="unique_attendance_per_employee_per_day",
            )
        ]
        indexes = [
            # Most common query: all attendance for an employee, sorted by date
            models.Index(
                fields=["employee", "-date"],
                name="idx_attendance_employee_date",
            ),
            # Dashboard query: all attendance on a specific date
            models.Index(fields=["date", "status"], name="idx_attendance_date_status"),
        ]
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"

    def __str__(self) -> str:
        return f"{self.employee.employee_id} — {self.date} — {self.status}"
