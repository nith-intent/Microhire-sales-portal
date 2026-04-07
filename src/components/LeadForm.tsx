import { useState } from "react";
import type { FormEvent } from "react";
import DatePicker from "react-datepicker";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import {
  DD_MM_YYYY_PLACEHOLDER,
  formatDateToDDMMYYYY,
  parseDDMMYYYY,
  toLocalISODateString,
} from "../utils/dateInput";
import { OrganisationAutocomplete } from "./OrganisationAutocomplete";
import type { OrgResult } from "./OrganisationAutocomplete";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/lead-form.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const ROOM_OPTIONS = [
  "Westin Ballroom",
  "Westin Ballroom 1",
  "Westin Ballroom 2",
  "Elevate",
  "Elevate 1",
  "Elevate 2",
  "Thrive",
];

export interface LeadFormData {
  organisation: string;
  organisationAddress: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  eventStartDate: string;
  eventEndDate: string;
  venue: string;
  room: string;
  attendees: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LeadForm() {
  const [formData, setFormData] = useState<LeadFormData>({
    organisation: "",
    organisationAddress: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    eventStartDate: "",
    eventEndDate: "",
    venue: "Westin Brisbane",
    room: "",
    attendees: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeadFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const [lastBookingNo, setLastBookingNo] = useState<string | null>(null);
  /** True when contact/org sync to BookingsDb returned error (lead still saved). */
  const [syncDbIssue, setSyncDbIssue] = useState(false);
  /** ID of existing org selected from autocomplete (null = new org). */
  const [existingOrgId, setExistingOrgId] = useState<number | null>(null);
  /** True when address was auto-filled from an existing org selection. */
  const [orgAddressLocked, setOrgAddressLocked] = useState(false);

  const updateField = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBlur = (field: keyof LeadFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleOrgSelect = (org: OrgResult) => {
    updateField("organisation", org.name);
    if (org.address) {
      updateField("organisationAddress", org.address);
      setOrgAddressLocked(true);
    } else {
      // Existing org with no address on file — keep editable
      setOrgAddressLocked(false);
    }
    setExistingOrgId(org.id);
  };

  const handleOrgClear = () => {
    setExistingOrgId(null);
    setOrgAddressLocked(false);
    updateField("organisationAddress", "");
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!formData.organisation.trim()) {
      newErrors.organisation = "Organisation is required";
    }
    if (!formData.organisationAddress.trim()) {
      newErrors.organisationAddress = "Organisation address is required";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }
    const startDate = parseDDMMYYYY(formData.eventStartDate);
    if (!formData.eventStartDate.trim()) {
      newErrors.eventStartDate = "Event start date is required";
    } else if (!startDate) {
      newErrors.eventStartDate = "Enter a valid date (DD-MM-YYYY)";
    }

    const endDate = parseDDMMYYYY(formData.eventEndDate);
    if (!formData.eventEndDate.trim()) {
      newErrors.eventEndDate = "Event end date is required";
    } else if (!endDate) {
      newErrors.eventEndDate = "Enter a valid date (DD-MM-YYYY)";
    } else if (startDate && endDate < startDate) {
      newErrors.eventEndDate = "End date must be on or after start date";
    }
    if (!formData.room) {
      newErrors.room = "Room is required";
    }
    if (!formData.attendees.trim()) {
      newErrors.attendees = "Attendees is required";
    } else if (isNaN(Number(formData.attendees)) || Number(formData.attendees) < 1) {
      newErrors.attendees = "Please enter a valid number of attendees";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({
      organisation: true,
      organisationAddress: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      eventStartDate: true,
      eventEndDate: true,
      room: true,
      attendees: true,
    });

    if (!validate()) return;

    const startForApi = parseDDMMYYYY(formData.eventStartDate);
    const endForApi = parseDDMMYYYY(formData.eventEndDate);
    if (!startForApi || !endForApi) return;

    const payload = {
      ...formData,
      eventStartDate: toLocalISODateString(startForApi),
      eventEndDate: toLocalISODateString(endForApi),
      ...(existingOrgId ? { existingOrgId } : {}),
    };

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setErrors({});

    try {
      const apiUrl = `${API_BASE}/api/leads`.replace(/([^:]\/)\/+/g, "$1");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = Array.isArray(data.errors)
          ? data.errors.join(" ")
          : data.error ?? `Request failed (${res.status})`;
        setErrors({ organisation: message });
        return;
      }

      const submittedEmail = formData.email;
      const contactSync = data.contactSync as string | undefined;
      const orgSync = data.orgSync as string | undefined;
      const bookingNo = (data.bookingNo as string | undefined) ?? null;
      setSyncDbIssue(contactSync === "error" || orgSync === "error");
      setLastBookingNo(bookingNo);
      setSubmitSuccess(true);
      setFormData({
        organisation: "",
        organisationAddress: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        eventStartDate: "",
        eventEndDate: "",
        venue: "Westin Brisbane",
        room: "",
        attendees: "",
      });
      setTouched({});
      setExistingOrgId(null);
      setOrgAddressLocked(false);
      setLastSubmittedEmail(submittedEmail);
    } catch (err) {
      setErrors({
        organisation:
          err instanceof Error ? err.message : "Failed to save lead. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="lead-form-card">
        <div className="lead-form-success" role="status" aria-live="polite">
          <CheckCircle className="lead-form-success-icon" size={28} weight="fill" aria-hidden />
          <div>
            <p className="lead-form-success-text">
              A new light pencil quote has been created for this contact and organization inside
              RentalPoint and an email has been sent to{" "}
              <strong className="lead-form-success-email">
                {lastSubmittedEmail || "your customer"}
              </strong>
              .
            </p>
            {lastBookingNo && (
              <p className="lead-form-success-booking">
                Booking number: <strong>{lastBookingNo}</strong>
              </p>
            )}
          </div>
        </div>
        {syncDbIssue && (
          <p className="lead-form-success-warning" role="note">
            Note: there was an issue syncing to the customer database.
          </p>
        )}
        <div className="lead-form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="lead-form-submit"
            onClick={() => {
              setSubmitSuccess(false);
              setLastSubmittedEmail("");
              setLastBookingNo(null);
              setSyncDbIssue(false);
            }}
          >
            Add another lead
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="lead-form-card" onSubmit={handleSubmit}>
      <div className="lead-form-title">Enter New Westin Lead</div>

      <div className="lead-form-section">
        <div className="lead-form-grid two-col">
          <div className="lead-form-field">
            <label htmlFor="organisation">Organisation</label>
            <OrganisationAutocomplete
              id="organisation"
              value={formData.organisation}
              onChange={(name) => {
                updateField("organisation", name);
              }}
              onSelect={handleOrgSelect}
              onClear={handleOrgClear}
              onBlur={() => handleBlur("organisation")}
              className={touched.organisation && errors.organisation ? "lead-form-touched" : ""}
            />
            {touched.organisation && errors.organisation && (
              <span className="field-error">{errors.organisation}</span>
            )}
          </div>
          <div className="lead-form-field">
            <label htmlFor="organisationAddress">
              Organisation Address
              {orgAddressLocked && <span style={{ fontWeight: 400, fontSize: "0.7rem", marginLeft: "0.5rem", color: "#888" }}>(auto-filled)</span>}
            </label>
            <div className={orgAddressLocked ? "org-address-row" : ""}>
              <div className={orgAddressLocked ? "lead-form-field" : ""} style={orgAddressLocked ? {} : undefined}>
                <input
                  id="organisationAddress"
                  type="text"
                  value={formData.organisationAddress}
                  onChange={(e) => updateField("organisationAddress", e.target.value)}
                  onBlur={() => handleBlur("organisationAddress")}
                  className={touched.organisationAddress && errors.organisationAddress ? "lead-form-touched" : ""}
                  autoComplete="street-address"
                  disabled={orgAddressLocked}
                />
              </div>
              {orgAddressLocked && (
                <button
                  type="button"
                  className="org-address-clear"
                  onClick={() => {
                    setOrgAddressLocked(false);
                    setExistingOrgId(null);
                  }}
                  title="Use a different address"
                >
                  Change
                </button>
              )}
            </div>
            {touched.organisationAddress && errors.organisationAddress && (
              <span className="field-error">{errors.organisationAddress}</span>
            )}
          </div>
        </div>
      </div>

      <div className="lead-form-section">
        <div className="lead-form-grid two-col">
          <div className="lead-form-field">
            <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            onBlur={() => handleBlur("firstName")}
            className={touched.firstName && errors.firstName ? "lead-form-touched" : ""}
            autoComplete="given-name"
          />
          {touched.firstName && errors.firstName && (
            <span className="field-error">{errors.firstName}</span>
          )}
        </div>
        <div className="lead-form-field">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            onBlur={() => handleBlur("lastName")}
            className={touched.lastName && errors.lastName ? "lead-form-touched" : ""}
            autoComplete="family-name"
          />
          {touched.lastName && errors.lastName && (
            <span className="field-error">{errors.lastName}</span>
          )}
        </div>
        </div>
      </div>

      <div className="lead-form-section">
        <div className="lead-form-grid two-col">
          <div className="lead-form-field">
            <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={touched.email && errors.email ? "lead-form-touched" : ""}
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <span className="field-error">{errors.email}</span>
          )}
        </div>
        <div className="lead-form-field">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
            onBlur={() => handleBlur("phoneNumber")}
            className={touched.phoneNumber && errors.phoneNumber ? "lead-form-touched" : ""}
            autoComplete="tel"
          />
          {touched.phoneNumber && errors.phoneNumber && (
            <span className="field-error">{errors.phoneNumber}</span>
          )}
        </div>
        </div>
      </div>

      <div className="lead-form-section">
        <div className="lead-form-grid two-col">

          <div className="lead-form-field">
            <label htmlFor="eventStartDate">Event Start Date</label>
            <DatePicker
              id="eventStartDate"
              wrapperClassName="lead-form-date-picker"
              selected={parseDDMMYYYY(formData.eventStartDate)}
              onChange={(date: Date | null) =>
                updateField("eventStartDate", date ? formatDateToDDMMYYYY(date) : "")
              }
              onBlur={() => handleBlur("eventStartDate")}
              dateFormat="dd-MM-yyyy"
              placeholderText={DD_MM_YYYY_PLACEHOLDER}
              autoComplete="off"
              showIcon
              toggleCalendarOnIconClick
              isClearable
              aria-describedby="event-date-format-hint"
              className={touched.eventStartDate && errors.eventStartDate ? "lead-form-touched" : ""}
            />
            {touched.eventStartDate && errors.eventStartDate && (
              <span className="field-error">{errors.eventStartDate}</span>
            )}
          </div>
          <div className="lead-form-field">
            <label htmlFor="eventEndDate">Event End Date</label>
            <DatePicker
              id="eventEndDate"
              wrapperClassName="lead-form-date-picker"
              selected={parseDDMMYYYY(formData.eventEndDate)}
              onChange={(date: Date | null) =>
                updateField("eventEndDate", date ? formatDateToDDMMYYYY(date) : "")
              }
              onBlur={() => handleBlur("eventEndDate")}
              dateFormat="dd-MM-yyyy"
              placeholderText={DD_MM_YYYY_PLACEHOLDER}
              autoComplete="off"
              showIcon
              toggleCalendarOnIconClick
              isClearable
              minDate={parseDDMMYYYY(formData.eventStartDate) ?? undefined}
              aria-describedby="event-date-format-hint"
              className={touched.eventEndDate && errors.eventEndDate ? "lead-form-touched" : ""}
            />
            {touched.eventEndDate && errors.eventEndDate && (
              <span className="field-error">{errors.eventEndDate}</span>
            )}
          </div>
        </div>
      </div>

      <div className="lead-form-section">
        <div className="lead-form-grid two-col">
          <div className="lead-form-field">
            <label htmlFor="venue">Venue</label>
          <select
            id="venue"
            value={formData.venue}
            onChange={(e) => updateField("venue", e.target.value)}
          >
            <option value="Westin Brisbane">Westin Brisbane</option>
          </select>
        </div>
        <div className="lead-form-field">
          <label htmlFor="room">Room</label>
          <select
            id="room"
            value={formData.room}
            onChange={(e) => updateField("room", e.target.value)}
            onBlur={() => handleBlur("room")}
            className={touched.room && errors.room ? "lead-form-touched" : ""}
          >
            <option value="">Select room</option>
            {ROOM_OPTIONS.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
          {touched.room && errors.room && (
            <span className="field-error">{errors.room}</span>
          )}
        </div>
        </div>
      </div>

      <div className="lead-form-section">
        <div className="lead-form-grid">
          <div className="lead-form-field">
            <label htmlFor="attendees">Attendees</label>
          <input
            id="attendees"
            type="number"
            min={1}
            value={formData.attendees}
            onChange={(e) => updateField("attendees", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            onBlur={() => handleBlur("attendees")}
            className={touched.attendees && errors.attendees ? "lead-form-touched" : ""}
          />
          {touched.attendees && errors.attendees && (
            <span className="field-error">{errors.attendees}</span>
          )}
        </div>
        </div>
      </div>

      <div className="lead-form-actions">
        <button
          type="submit"
          className="lead-form-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <PaperPlaneTilt size={20} weight="fill" />
              Save Lead
            </>
          )}
        </button>
      </div>
    </form>
  );
}
