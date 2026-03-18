"""
Centralized cache key management and invalidation helpers.
"""
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Cache TTLs (seconds)
EMPLOYEE_LIST_TTL = 30        # ← reduced from 120 — short enough that stale data
EMPLOYEE_DETAIL_TTL = 60      #   is never visible for long even if invalidation misses
ATTENDANCE_LIST_TTL = 20      # ← reduced from 60
DASHBOARD_STATS_TTL = 30      # ← reduced from 180


class CacheKeys:
    """Namespaced cache key builders."""

    @staticmethod
    def employee_list(page, page_size, search="", department=""):
        return f"hrms:employees:list:p{page}:ps{page_size}:s{search}:d{department}"

    @staticmethod
    def employee_detail(employee_id):
        return f"hrms:employees:detail:{employee_id}"

    @staticmethod
    def attendance_list(employee_id, page, page_size, date="", status=""):
        return f"hrms:attendance:list:{employee_id}:p{page}:ps{page_size}:dt{date}:st{status}"

    @staticmethod
    def dashboard_stats():
        return "hrms:dashboard:stats"


def invalidate_employee_caches():
    """
    Wipe all employee list caches after any create/update/delete.
    Uses delete_pattern (django-redis) with a fallback to manual key deletion.
    """
    try:
        # delete_pattern requires django-redis — try it first
        deleted = cache.delete_pattern("hrms:employees:list:*")
        cache.delete_pattern("hrms:dashboard:stats*")
        logger.debug("Invalidated employee caches via delete_pattern")
    except Exception as exc:
        # Fallback: clear the entire cache namespace if delete_pattern unavailable
        logger.warning("delete_pattern failed (%s), clearing all caches", exc)
        try:
            cache.clear()
        except Exception as clear_exc:
            logger.error("Cache clear also failed: %s", clear_exc)


def invalidate_attendance_caches(employee_id):
    """Wipe attendance caches for a specific employee."""
    try:
        cache.delete_pattern(f"hrms:attendance:list:{employee_id}:*")
        cache.delete_pattern("hrms:attendance:list:all:*")
        cache.delete_pattern("hrms:dashboard:stats*")
        cache.delete(f"attendance:summary:{employee_id}")
        logger.debug("Invalidated attendance caches for employee %s", employee_id)
    except Exception as exc:
        logger.warning("Attendance cache invalidation failed (%s), clearing all", exc)
        try:
            cache.clear()
        except Exception:
            pass