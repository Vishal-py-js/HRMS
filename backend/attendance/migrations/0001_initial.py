import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("employees", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Attendance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("employee", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="attendance",
                    to="employees.employee",
                )),
                ("date", models.DateField(db_index=True)),
                ("status", models.CharField(
                    choices=[("Present", "Present"), ("Absent", "Absent")],
                    db_index=True,
                    max_length=10,
                )),
                ("notes", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Attendance Record",
                "verbose_name_plural": "Attendance Records",
                "db_table": "attendance",
                "ordering": ["-date", "employee__full_name"],
                "indexes": [
                    models.Index(fields=["employee", "-date"], name="idx_attendance_employee_date"),
                    models.Index(fields=["date", "status"], name="idx_attendance_date_status"),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=["employee", "date"],
                        name="unique_attendance_per_employee_per_day",
                    )
                ],
            },
        ),
    ]
