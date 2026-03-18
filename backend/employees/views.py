import logging
from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Employee, Department
from .serializers import EmployeeListSerializer, EmployeeDetailSerializer
from .filters import EmployeeFilter
from core.cache import (
    CacheKeys,
    EMPLOYEE_LIST_TTL,
    EMPLOYEE_DETAIL_TTL,
    DASHBOARD_STATS_TTL,
    invalidate_employee_caches,
)

logger = logging.getLogger(__name__)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    Full CRUD viewset for Employee.

    Caching strategy:
    - List results cached per (page, page_size, search, department) combination
    - Individual records cached by UUID
    - All employee caches are invalidated on any mutation (create/update/delete)

    Query optimizations:
    - Annotates attendance counts directly on the queryset (no N+1)
    - Only fetches columns needed for the list serializer in list context
    - Uses select_related where FKs exist (future-proofing)
    """

    filterset_class = EmployeeFilter
    search_fields = ["full_name", "email", "employee_id"]
    ordering_fields = ["full_name", "department", "created_at", "employee_id"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return EmployeeListSerializer
        return EmployeeDetailSerializer

    def get_queryset(self):
        """
        Base queryset with attendance count annotations.
        Annotating here means one DB round-trip regardless of page size.
        """
        return (
            Employee.objects.annotate(
                total_present=Count(
                    "attendance", filter=Q(attendance__status="Present")
                ),
                total_absent=Count(
                    "attendance", filter=Q(attendance__status="Absent")
                ),
            )
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
    # Skip Redis cache on list — indexes make DB fast enough,
    # and caching here causes stale UI after mutations.
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save()
        invalidate_employee_caches()

    def perform_update(self, serializer):
        instance = serializer.save()
        cache.delete(CacheKeys.employee_detail(str(instance.pk)))
        invalidate_employee_caches()

    def perform_destroy(self, instance):
        cache.delete(CacheKeys.employee_detail(str(instance.pk)))
        instance.delete()
        invalidate_employee_caches()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": f"Employee {instance.full_name} has been deleted."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="departments")
    def departments(self, request):
        """Return all valid department choices for frontend dropdowns."""
        data = [{"value": v, "label": l} for v, l in Department.choices]
        return Response(data)

    @action(detail=False, methods=["get"], url_path="dashboard-stats")
    def dashboard_stats(self, request):
        """
        Aggregated stats for the dashboard.
        Heavily cached — this query touches every row in both tables.
        """
        from attendance.models import Attendance
        from django.utils import timezone
        import datetime

        cache_key = CacheKeys.dashboard_stats()
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        today = timezone.now().date()
        total_employees = Employee.objects.count()

        dept_breakdown = list(
            Employee.objects.values("department")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Today's attendance summary
        today_attendance = Attendance.objects.filter(date=today)
        present_today = today_attendance.filter(status="Present").count()
        absent_today = today_attendance.filter(status="Absent").count()
        not_marked = total_employees - present_today - absent_today

        data = {
            "total_employees": total_employees,
            "department_breakdown": dept_breakdown,
            "attendance_today": {
                "date": str(today),
                "present": present_today,
                "absent": absent_today,
                "not_marked": max(not_marked, 0),
            },
        }

        cache.set(cache_key, data, timeout=DASHBOARD_STATS_TTL)
        return Response(data)
    
    @action(detail=False, methods=["get"], url_path="not-marked")
    def not_marked(self, request):
        """
        Returns employees who have NO attendance record for a given date.
        Uses a subquery exclusion — one efficient DB round-trip.
        """
        from django.db.models import Subquery, OuterRef
        from attendance.models import Attendance

        date_str = request.query_params.get("date")
        if not date_str:
            return Response(
                {"error": "date query parameter is required (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate date format
        try:
            from datetime import date as date_type
            from django.utils.dateparse import parse_date
            target_date = parse_date(date_str)
            if not target_date:
                raise ValueError
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Employees who HAVE attendance on this date
        marked_employee_ids = Attendance.objects.filter(
            date=target_date
        ).values_list("employee_id", flat=True)

        # Exclude them — what remains are the "not marked" employees
        queryset = (
            Employee.objects
            .exclude(id__in=marked_employee_ids)
            .annotate(
                total_present=Count("attendance", filter=Q(attendance__status="Present")),
                total_absent=Count("attendance", filter=Q(attendance__status="Absent")),
            )
            .order_by("full_name")
        )

        # Run through pagination so large orgs still get pages
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = EmployeeListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = EmployeeListSerializer(queryset, many=True)
        return Response(serializer.data)
