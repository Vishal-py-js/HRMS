# import logging
# from django.core.cache import cache
# from django.db import transaction
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response

# from .models import Attendance
# from .serializers import (
#     AttendanceListSerializer,
#     AttendanceWriteSerializer,
#     BulkAttendanceSerializer,
# )
# from .filters import AttendanceFilter
# from core.cache import (
#     CacheKeys,
#     ATTENDANCE_LIST_TTL,
#     invalidate_attendance_caches,
#     invalidate_employee_caches,
# )

# logger = logging.getLogger(__name__)


# class AttendanceViewSet(viewsets.ModelViewSet):
#     """
#     CRUD viewset for Attendance records.

#     Query optimizations:
#     - select_related('employee') on every query → eliminates N+1 joins
#     - Filtered querysets use indexed columns (employee_id, date, status)
#     - Bulk create uses update_or_create inside a single transaction

#     Caching:
#     - List results are cached per employee + filter combination
#     - Cache invalidated whenever attendance is mutated
#     """

#     filterset_class = AttendanceFilter
#     ordering_fields = ["date", "status", "employee__full_name"]
#     ordering = ["-date"]

#     def get_serializer_class(self):
#         if self.action in ("create", "update", "partial_update"):
#             return AttendanceWriteSerializer
#         return AttendanceListSerializer

#     def get_queryset(self):
#         """
#         select_related pre-fetches the employee row in the same SQL JOIN,
#         eliminating one DB query per attendance record in the response.
#         """
#         return (
#             Attendance.objects.select_related("employee")
#             .only(
#                 "id",
#                 "date",
#                 "status",
#                 "notes",
#                 "created_at",
#                 "updated_at",
#                 "employee__id",
#                 "employee__full_name",
#                 "employee__employee_id",
#                 "employee__department",
#             )
#             .order_by("-date")
#         )

#     def list(self, request, *args, **kwargs):
#         return super().list(request, *args, **kwargs)

#     def perform_create(self, serializer):
#         instance = serializer.save()
#         invalidate_attendance_caches(str(instance.employee_id))
#         invalidate_employee_caches()

#     def perform_update(self, serializer):
#         instance = serializer.save()
#         invalidate_attendance_caches(str(instance.employee_id))
#         invalidate_employee_caches()

#     def perform_destroy(self, instance):
#         employee_id = str(instance.employee_id)
#         instance.delete()
#         invalidate_attendance_caches(employee_id)
#         invalidate_employee_caches()

#     def destroy(self, request, *args, **kwargs):
#         instance = self.get_object()
#         self.perform_destroy(instance)
#         return Response(
#             {"message": "Attendance record deleted."},
#             status=status.HTTP_200_OK,
#         )

#     @action(detail=False, methods=["post"], url_path="bulk")
#     def bulk_create(self, request):
#         """
#         Mark attendance for multiple employees on a single date in one call.
#         Uses update_or_create so re-submitting is idempotent — no duplicate errors.
#         All DB writes happen inside a single transaction for atomicity.
#         """
#         serializer = BulkAttendanceSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         date = serializer.validated_data["date"]
#         records = serializer.validated_data["records"]

#         created_count = 0
#         updated_count = 0

#         with transaction.atomic():
#             for record in records:
#                 _, created = Attendance.objects.update_or_create(
#                     employee=record["employee"],
#                     date=date,
#                     defaults={
#                         "status": record["status"],
#                         "notes": record.get("notes", ""),
#                     },
#                 )
#                 if created:
#                     created_count += 1
#                 else:
#                     updated_count += 1

#         # Invalidate caches for all affected employees
#         for record in records:
#             invalidate_attendance_caches(str(record["employee"].id))
#         invalidate_employee_caches()

#         return Response(
#             {
#                 "message": f"Attendance processed for {len(records)} employees.",
#                 "created": created_count,
#                 "updated": updated_count,
#                 "date": str(date),
#             },
#             status=status.HTTP_200_OK,
#         )

#     @action(detail=False, methods=["get"], url_path="summary")
#     def summary(self, request):
#         """
#         Attendance summary (present/absent counts) for a specific employee.
#         Useful for the employee detail page.
#         """
#         from django.db.models import Count, Q

#         employee_id = request.query_params.get("employee")
#         if not employee_id:
#             return Response(
#                 {"error": "employee query parameter is required."},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         cache_key = f"attendance:summary:{employee_id}"
#         cached = cache.get(cache_key)
#         if cached is not None:
#             return Response(cached)

#         from employees.models import Employee
#         try:
#             employee = Employee.objects.get(pk=employee_id)
#         except Employee.DoesNotExist:
#             return Response(
#                 {"error": "Employee not found."},
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         stats = Attendance.objects.filter(employee=employee).aggregate(
#             total_present=Count("id", filter=Q(status="Present")),
#             total_absent=Count("id", filter=Q(status="Absent")),
#             total_records=Count("id"),
#         )

#         data = {
#             "employee_id": str(employee.id),
#             "employee_name": employee.full_name,
#             **stats,
#         }
#         cache.set(cache_key, data, timeout=120)
#         return Response(data)















import logging
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Attendance
from .serializers import (
    AttendanceListSerializer,
    AttendanceWriteSerializer,
    BulkAttendanceSerializer,
)
from .filters import AttendanceFilter

logger = logging.getLogger(__name__)


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Attendance records.

    Query optimizations:
    - select_related('employee') on every query eliminates N+1 joins
    - .only() fetches only required columns, reducing row transfer size
    - Bulk create uses update_or_create inside a single transaction
    """

    filterset_class = AttendanceFilter
    ordering_fields = ["date", "status", "employee__full_name"]
    ordering = ["-date"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AttendanceWriteSerializer
        return AttendanceListSerializer

    def get_queryset(self):
        """
        select_related pre-fetches the employee in the same SQL JOIN.
        .only() limits columns fetched from the DB.
        """
        return (
            Attendance.objects.select_related("employee")
            .only(
                "id",
                "date",
                "status",
                "notes",
                "created_at",
                "updated_at",
                "employee__id",
                "employee__full_name",
                "employee__employee_id",
                "employee__department",
            )
            .order_by("-date")
        )

    def list(self, request, *args, **kwargs):
        """Paginated attendance list — hits DB directly."""
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Attendance record deleted."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        """
        Mark attendance for multiple employees on a single date in one call.
        Uses update_or_create so re-submitting is idempotent.
        All DB writes happen inside a single transaction for atomicity.
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        date    = serializer.validated_data["date"]
        records = serializer.validated_data["records"]

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for record in records:
                _, created = Attendance.objects.update_or_create(
                    employee=record["employee"],
                    date=date,
                    defaults={
                        "status": record["status"],
                        "notes": record.get("notes", ""),
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response(
            {
                "message": f"Attendance processed for {len(records)} employees.",
                "created": created_count,
                "updated": updated_count,
                "date": str(date),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Attendance summary (present/absent counts) for a specific employee.
        Used by the employee detail page stat cards.
        """
        from django.db.models import Count, Q
        from employees.models import Employee

        employee_id = request.query_params.get("employee")
        if not employee_id:
            return Response(
                {"error": "employee query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        stats = Attendance.objects.filter(employee=employee).aggregate(
            total_present=Count("id", filter=Q(status="Present")),
            total_absent=Count("id",  filter=Q(status="Absent")),
            total_records=Count("id"),
        )

        return Response({
            "employee_id":   str(employee.id),
            "employee_name": employee.full_name,
            **stats,
        })