from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Employee",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("employee_id", models.CharField(db_index=True, help_text="Unique human-readable employee identifier (e.g. EMP-001)", max_length=20, unique=True)),
                ("full_name", models.CharField(db_index=True, max_length=150)),
                ("email", models.EmailField(db_index=True, max_length=254, unique=True)),
                ("department", models.CharField(
                    choices=[
                        ("Engineering", "Engineering"),
                        ("Product", "Product"),
                        ("Design", "Design"),
                        ("Marketing", "Marketing"),
                        ("Sales", "Sales"),
                        ("Finance", "Finance"),
                        ("HR", "Human Resources"),
                        ("Operations", "Operations"),
                        ("Legal", "Legal"),
                        ("Customer Success", "Customer Success"),
                    ],
                    db_index=True,
                    max_length=50,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Employee",
                "verbose_name_plural": "Employees",
                "db_table": "employees",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["department", "full_name"], name="idx_emp_dept_name"),
                    models.Index(fields=["full_name"], name="idx_emp_full_name"),
                ],
            },
        ),
    ]
