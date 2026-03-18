import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, OperationalError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that normalizes all error responses
    into a consistent shape: { "error": str, "details": dict|None }

    This makes frontend error handling predictable regardless of
    which layer the error originates from.
    """
    # Let DRF handle its own exceptions first
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "error": _extract_message(response.data),
            "details": response.data if isinstance(response.data, dict) else None,
            "status_code": response.status_code,
        }
        response.data = error_payload
        return response

    # Handle Django-level and database exceptions not caught by DRF
    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                "error": "Validation error.",
                "details": exc.message_dict if hasattr(exc, "message_dict") else str(exc),
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        logger.warning("IntegrityError: %s", str(exc))
        return Response(
            {
                "error": "A record with this data already exists.",
                "details": None,
                "status_code": status.HTTP_409_CONFLICT,
            },
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, OperationalError):
        logger.error("Database OperationalError: %s", str(exc))
        return Response(
            {
                "error": "A database error occurred. Please try again.",
                "details": None,
                "status_code": status.HTTP_503_SERVICE_UNAVAILABLE,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Unknown exception — log and return 500
    logger.exception("Unhandled exception in view: %s", str(exc))
    return Response(
        {
            "error": "An unexpected server error occurred.",
            "details": None,
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _extract_message(data) -> str:
    """Collapse DRF error data into a single human-readable string."""
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return " ".join(str(item) for item in data)
    if isinstance(data, dict):
        messages = []
        for key, value in data.items():
            if isinstance(value, list):
                messages.append(f"{key}: {' '.join(str(v) for v in value)}")
            else:
                messages.append(f"{key}: {value}")
        return " | ".join(messages)
    return "An error occurred."
