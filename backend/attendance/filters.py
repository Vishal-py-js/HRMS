import django_filters
from .models import Attendance, AttendanceStatus


class AttendanceFilter(django_filters.FilterSet):
    """
    Filter set for the attendance list endpoint.
    Supports filtering by employee, date range, and status.
    """

    employee = django_filters.UUIDFilter(field_name="employee__id")
    date = django_filters.DateFilter(field_name="date")
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    status = django_filters.ChoiceFilter(choices=AttendanceStatus.choices)
    department = django_filters.CharFilter(field_name="employee__department")

    class Meta:
        model = Attendance
        fields = ["employee", "date", "date_from", "date_to", "status", "department"]
