// import { useState } from "react";
// import Modal from "@/components/ui/Modal";
// import Input from "@/components/ui/Input";
// import Select from "@/components/ui/Select";
// import Button from "@/components/ui/Button";
// import { useMarkAttendance, useUpdateAttendance } from "@/hooks/useAttendance";
// import { useEmployees } from "@/hooks/useEmployees";
// import { todayISO } from "@/lib/utils";

// const STATUS_OPTIONS = [
//   { value: "Present", label: "Present" },
//   { value: "Absent", label: "Absent" },
// ];

// export default function MarkAttendanceModal({ open, onClose, prefillEmployee = null, prefillDate=null, editRecord = null }) {
//   const isEdit = !!editRecord;

//   const [form, setForm] = useState(() => ({
//     employee: editRecord?.employee ?? prefillEmployee ?? "",
//     date: editRecord?.date ?? todayISO(),
//     status: editRecord?.status ?? "Present",
//     notes: editRecord?.notes ?? "",
//   }));
//   const [fieldErrors, setFieldErrors] = useState({});

//   // Only load employees list if not prefilled
//   const { data: employeesData } = useEmployees({ page_size: 100 });
//   const employees = employeesData?.results ?? [];

//   const markAttendance = useMarkAttendance();
//   const updateAttendance = useUpdateAttendance();

//   const isPending = markAttendance.isPending || updateAttendance.isPending;

//   const employeeOptions = employees.map((e) => ({
//     value: e.id,
//     label: `${e.employee_id} — ${e.full_name}`,
//   }));

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((p) => ({ ...p, [name]: value }));
//     if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: undefined }));
//   }

//   function validate() {
//     const errors = {};
//     if (!form.employee) errors.employee = "Please select an employee.";
//     if (!form.date) errors.date = "Date is required.";
//     if (!form.status) errors.status = "Status is required.";
//     return errors;
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     const errors = validate();
//     if (Object.keys(errors).length) { setFieldErrors(errors); return; }

//     try {
//       if (isEdit) {
//         await updateAttendance.mutateAsync({ id: editRecord.id, payload: form });
//       } else {
//         await markAttendance.mutateAsync(form);
//       }
//       handleClose();
//     } catch (error) {
//       if (error.details && typeof error.details === "object") {
//         setFieldErrors(error.details);
//       }
//     }
//   }

//   function handleClose() {
//     setFieldErrors({});
//     onClose();
//   }

//   return (
//     <Modal
//       open={open}
//       onClose={handleClose}
//       title={isEdit ? "Edit Attendance" : "Mark Attendance"}
//       description={isEdit ? "Update the attendance record below." : "Record attendance for an employee."}
//     >
//       <form onSubmit={handleSubmit} noValidate>
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//           {!prefillEmployee && (
//             <Select
//               label="Employee"
//               name="employee"
//               id="att_employee"
//               placeholder="Select employee…"
//               options={employeeOptions}
//               value={form.employee}
//               onChange={handleChange}
//               error={fieldErrors.employee}
//               containerClassName="sm:col-span-2"
//               required
//               disabled={isEdit}
//             />
//           )}

//           <Input
//             label="Date"
//             name="date"
//             id="att_date"
//             type="date"
//             max={todayISO()}
//             value={form.date}
//             onChange={handleChange}
//             error={fieldErrors.date}
//             required
//           />

//           <Select
//             label="Status"
//             name="status"
//             id="att_status"
//             options={STATUS_OPTIONS}
//             value={form.status}
//             onChange={handleChange}
//             error={fieldErrors.status}
//             required
//           />

//           <Input
//             label="Notes"
//             name="notes"
//             id="att_notes"
//             placeholder="Optional notes…"
//             value={form.notes}
//             onChange={handleChange}
//             containerClassName="sm:col-span-2"
//           />
//         </div>

//         <Modal.Footer>
//           <Button variant="secondary" size="sm" type="button" onClick={handleClose}>
//             Cancel
//           </Button>
//           <Button variant="primary" size="sm" type="submit" loading={isPending}>
//             {isEdit ? "Save Changes" : "Mark Attendance"}
//           </Button>
//         </Modal.Footer>
//       </form>
//     </Modal>
//   );
// }




















import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useMarkAttendance, useUpdateAttendance } from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import { todayISO } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "Present", label: "Present" },
  { value: "Absent",  label: "Absent"  },
];

const EMPTY_FORM = {
  employee: "",
  date:     todayISO(),
  status:   "Present",
  notes:    "",
};

export default function MarkAttendanceModal({
  open,
  onClose,
  prefillEmployee = null,
  prefillDate     = null,
  editRecord      = null,
}) {
  const isEdit = !!editRecord;

  const [form, setForm]               = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Reset form whenever the modal opens or prefill values change ────────
  // This is the core fix: useState initializer only runs once on mount,
  // so we need useEffect to re-sync form state every time the modal opens
  // with new props (e.g. clicking Mark on a different employee row).
  useEffect(() => {
    if (!open) return;

    setForm({
      employee: editRecord?.employee ?? prefillEmployee ?? "",
      date:     editRecord?.date     ?? prefillDate     ?? todayISO(),
      status:   editRecord?.status   ?? "Present",
      notes:    editRecord?.notes    ?? "",
    });
    setFieldErrors({});
  }, [open, prefillEmployee, prefillDate, editRecord]);

  // Employee list for the dropdown (only needed when no prefill)
  const { data: employeesData } = useEmployees(
    !prefillEmployee && !isEdit ? { page_size: 200 } : { page_size: 0 }
  );
  const employees = employeesData?.results ?? [];

  const markAttendance  = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();
  const isPending = markAttendance.isPending || updateAttendance.isPending;

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.employee_id} — ${e.full_name}`,
  }));

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate() {
    const errors = {};
    if (!form.employee) errors.employee = "Please select an employee.";
    if (!form.date)     errors.date     = "Date is required.";
    if (!form.status)   errors.status   = "Status is required.";
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
      if (isEdit) {
        await updateAttendance.mutateAsync({ id: editRecord.id, payload: form });
      } else {
        await markAttendance.mutateAsync(form);
      }
      handleClose();
    } catch (error) {
      // Surface field-level errors returned by the backend serializer
      if (error.details && typeof error.details === "object") {
        setFieldErrors(error.details);
      }
    }
  }

  function handleClose() {
    setFieldErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Attendance" : "Mark Attendance"}
      description={
        isEdit
          ? "Update the attendance record below."
          : "Record attendance for an employee."
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Employee select — hidden when prefilled from a row click */}
          {!prefillEmployee && !isEdit && (
            <Select
              label="Employee"
              name="employee"
              id="att_employee"
              placeholder="Select employee…"
              options={employeeOptions}
              value={form.employee}
              onChange={handleChange}
              error={fieldErrors.employee}
              containerClassName="sm:col-span-2"
              required
            />
          )}

          {/* Show employee name read-only when prefilled */}
          {prefillEmployee && !isEdit && (
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-700 mb-1.5">Employee</p>
              <div className="h-9 flex items-center px-3 rounded-lg border border-surface-border bg-surface-subtle text-sm text-slate-600">
                {employees.find((e) => e.id === prefillEmployee)?.full_name
                  ?? "Selected employee"}
              </div>
            </div>
          )}

          <Input
            label="Date"
            name="date"
            id="att_date"
            type="date"
            max={todayISO()}
            value={form.date}
            onChange={handleChange}
            error={fieldErrors.date}
            required
          />

          <Select
            label="Status"
            name="status"
            id="att_status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={handleChange}
            error={fieldErrors.status}
            required
          />

          <Input
            label="Notes"
            name="notes"
            id="att_notes"
            placeholder="Optional notes…"
            value={form.notes}
            onChange={handleChange}
            containerClassName="sm:col-span-2"
          />

        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isPending}
          >
            {isEdit ? "Save Changes" : "Mark Attendance"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}