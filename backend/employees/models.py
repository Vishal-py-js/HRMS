import uuid
from django.db import models
from django.core.validators import EmailValidator


class Department(models.TextChoices):
    ENGINEERING = "Engineering", "Engineering"
    PRODUCT = "Product", "Product"
    DESIGN = "Design", "Design"
    MARKETING = "Marketing", "Marketing"
    SALES = "Sales", "Sales"
    FINANCE = "Finance", "Finance"
    HR = "HR", "Human Resources"
    OPERATIONS = "Operations", "Operations"
    LEGAL = "Legal", "Legal"
    CUSTOMER_SUCCESS = "Customer Success", "Customer Success"


class Employee(models.Model):
    """
    Core employee record.

    Uses UUID primary key to:
    - Avoid sequential ID enumeration in URLs
    - Simplify future distributed / multi-tenant migrations
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Unique human-readable employee identifier (e.g. EMP-001)",
    )
    full_name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        db_index=True,
    )
    department = models.CharField(
        max_length=50,
        choices=Department.choices,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "employees"
        ordering = ["-created_at"]
        indexes = [
            # Composite index used by the common "search within department" query
            models.Index(fields=["department", "full_name"], name="idx_emp_dept_name"),
            # Supports full-name prefix search (LIKE 'John%')
            models.Index(fields=["full_name"], name="idx_emp_full_name"),
        ]
        verbose_name = "Employee"
        verbose_name_plural = "Employees"

    def __str__(self) -> str:
        return f"{self.employee_id} — {self.full_name}"
