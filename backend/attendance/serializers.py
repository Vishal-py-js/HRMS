from rest_framework import serializers
from django.utils import timezone
from .models import Attendance, AttendanceStatus
from employees.models import Employee


class AttendanceListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list endpoints.
    Includes denormalized employee fields to avoid a second API call
    on the frontend.
    """

    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_id", read_only=True)
    employee_department = serializers.CharField(source="employee.department", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_code",
            "employee_department",
            "date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AttendanceWriteSerializer(serializers.ModelSerializer):
    """Used for create and update operations."""

    class Meta:
        model = Attendance
        fields = ["id", "employee", "date", "status", "notes"]
        read_only_fields = ["id"]

    def validate_date(self, value):
        """Reject future dates — attendance can't be marked in advance."""
        if value > timezone.now().date():
            raise serializers.ValidationError(
                "Attendance cannot be marked for a future date."
            )
        return value

    def validate_employee(self, value):
        if not Employee.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Employee not found.")
        return value

    def validate(self, attrs):
        """
        Enforce the unique constraint at the serializer level so we return
        a 400 with a clear message rather than a raw 500 IntegrityError.
        """
        employee = attrs.get("employee", getattr(self.instance, "employee", None))
        date = attrs.get("date", getattr(self.instance, "date", None))

        qs = Attendance.objects.filter(employee=employee, date=date)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                {
                    "date": (
                        f"Attendance for {employee.full_name} on {date} "
                        "has already been marked. Use edit to update it."
                    )
                }
            )
        return attrs


class BulkAttendanceItemSerializer(serializers.Serializer):
    """Single item within a bulk attendance submission."""

    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    notes = serializers.CharField(max_length=255, required=False, default="")


class BulkAttendanceSerializer(serializers.Serializer):
    """
    Mark attendance for multiple employees in a single API call.
    Useful for marking a full team's attendance at once.
    """

    date = serializers.DateField()
    records = BulkAttendanceItemSerializer(many=True, min_length=1)

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError(
                "Attendance cannot be marked for a future date."
            )
        return value
