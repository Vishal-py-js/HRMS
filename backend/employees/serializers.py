from rest_framework import serializers
from .models import Employee, Department


class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list endpoints.
    Excludes heavy fields to reduce payload size when returning many records.
    """

    attendance_summary = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "full_name",
            "email",
            "department",
            "created_at",
            "attendance_summary",
        ]
        read_only_fields = ["id", "created_at"]

    def get_attendance_summary(self, obj) -> dict:
        """
        Return pre-annotated attendance counts if present on the queryset,
        otherwise fall back to None to avoid N+1 queries.
        """
        return {
            "total_present": getattr(obj, "total_present", 0),
            "total_absent": getattr(obj, "total_absent", 0),
        }


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full serializer used for create / retrieve / update operations."""

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "full_name",
            "email",
            "department",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_employee_id(self, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Employee ID cannot be blank.")
        return value

    def validate_full_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return value

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_department(self, value: str) -> str:
        valid = [choice[0] for choice in Department.choices]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid department. Choose from: {', '.join(valid)}"
            )
        return value

    def validate(self, attrs):
        """Cross-field uniqueness checks with helpful error messages."""
        instance = self.instance

        # Check employee_id uniqueness (exclude self on update)
        qs = Employee.objects.filter(employee_id=attrs.get("employee_id", ""))
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {"employee_id": "An employee with this Employee ID already exists."}
            )

        # Check email uniqueness (exclude self on update)
        qs = Employee.objects.filter(email=attrs.get("email", "").lower())
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {"email": "An employee with this email address already exists."}
            )

        return attrs


class DepartmentChoiceSerializer(serializers.Serializer):
    """Returns all valid department choices for frontend dropdowns."""

    value = serializers.CharField()
    label = serializers.CharField()
