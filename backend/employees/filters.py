import django_filters
from .models import Employee, Department


class EmployeeFilter(django_filters.FilterSet):
    """
    Filter set for the employee list endpoint.
    Supports filtering by department and searching by name/email/id.
    """

    department = django_filters.ChoiceFilter(choices=Department.choices)
    search = django_filters.CharFilter(method="filter_search", label="Search")

    class Meta:
        model = Employee
        fields = ["department"]

    def filter_search(self, queryset, name, value):
        """
        Case-insensitive partial match across employee_id, full_name, and email.
        Uses __icontains which maps to ILIKE in PostgreSQL and benefits from
        pg_trgm indexes if installed (CREATE EXTENSION pg_trgm).
        """
        if not value:
            return queryset
        from django.db.models import Q

        return queryset.filter(
            Q(full_name__icontains=value)
            | Q(email__icontains=value)
            | Q(employee_id__icontains=value)
        )
