import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useEmployees";

const INITIAL_FORM = {
  employee_id: "",
  full_name: "",
  email: "",
  department: "",
};

export default function AddEmployeeModal({ open, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: departments = [] } = useDepartments();
  const createEmployee = useCreateEmployee();

  const deptOptions = departments.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate() {
    const errors = {};
    if (!form.employee_id.trim()) errors.employee_id = "Employee ID is required.";
    if (!form.full_name.trim()) errors.full_name = "Full name is required.";
    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!form.department) errors.department = "Department is required.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    try {
      await createEmployee.mutateAsync(form);
      handleClose();
    } catch (error) {
      // Surface field-level errors from backend
      if (error.details && typeof error.details === "object") {
        setFieldErrors(error.details);
      }
    }
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Employee"
      description="Fill in the details to create a new employee record."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Employee ID"
            name="employee_id"
            id="employee_id"
            placeholder="EMP-001"
            value={form.employee_id}
            onChange={handleChange}
            error={fieldErrors.employee_id}
            required
            autoFocus
          />
          <Input
            label="Full Name"
            name="full_name"
            id="full_name"
            placeholder="Jane Doe"
            value={form.full_name}
            onChange={handleChange}
            error={fieldErrors.full_name}
            required
          />
          <Input
            label="Email Address"
            name="email"
            id="email"
            type="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            className="sm:col-span-2"
            containerClassName="sm:col-span-2"
            required
          />
          <Select
            label="Department"
            name="department"
            id="department"
            placeholder="Select department…"
            options={deptOptions}
            value={form.department}
            onChange={handleChange}
            error={fieldErrors.department}
            className="sm:col-span-2"
            containerClassName="sm:col-span-2"
            required
          />
        </div>

        <Modal.Footer>
          <Button variant="secondary" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={createEmployee.isPending}
          >
            Add Employee
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
