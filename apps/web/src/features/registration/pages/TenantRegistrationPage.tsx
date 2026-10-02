import { useState } from 'react';
import {
  registerTenant,
  type TenantType,
} from '../api/registration.api.js';

interface TenantRegistrationPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

const tenantTypes: Array<{ value: TenantType; label: string }> = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'SPECIALIST_PRACTICE', label: 'Specialist practice' },
  { value: 'MEDICAL_CENTER', label: 'Medical center' },
  { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic center' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'RADIOLOGY_CENTER', label: 'Radiology center' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'DENTAL_CLINIC', label: 'Dental clinic' },
  { value: 'OPTICAL_CENTER', label: 'Optical center' },
  { value: 'MATERNITY_CENTER', label: 'Maternity center' },
  { value: 'REHABILITATION_CENTER', label: 'Rehabilitation center' },
  { value: 'HOME_HEALTH_PROVIDER', label: 'Home health provider' },
  { value: 'AMBULANCE_PROVIDER', label: 'Ambulance provider' },
  { value: 'HEALTHCARE_NETWORK', label: 'Healthcare network' },
  {
    value: 'CORPORATE_HEALTH_PROVIDER',
    label: 'Corporate health provider',
  },
  { value: 'INSURER', label: 'Insurer' },
  { value: 'EXTERNAL_PROVIDER', label: 'External provider' },
  {
    value: 'OTHER_HEALTHCARE_PROVIDER',
    label: 'Other healthcare provider',
  },
];

export function TenantRegistrationPage({
  onSuccess,
  onBack,
}: TenantRegistrationPageProps) {
  const [form, setForm] = useState({
    tenantType: 'HOSPITAL' as TenantType,
    businessName: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(
    field: keyof typeof form,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(): Promise<void> {
    setError(null);
    setSubmitting(true);

    try {
      await registerTenant(form);
      onSuccess();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Registration could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="registration-shell">
      <div className="registration-form-container">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back
        </button>

        <div className="registration-intro">
          <p className="eyebrow">Organization registration</p>
          <h1>Register your healthcare organization</h1>
          <p>
            Create the organization account first. Detailed organization
            onboarding will be completed securely after verification.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label>
            <span>Organization type</span>
            <select
              required
              value={form.tenantType}
              onChange={(event) =>
                updateField('tenantType', event.target.value)
              }
            >
              {tenantTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Business / organization name</span>
            <input
              required
              value={form.businessName}
              onChange={(event) =>
                updateField('businessName', event.target.value)
              }
              autoComplete="organization"
            />
          </label>

          <label>
            <span>Administrator name</span>
            <input
              required
              value={form.adminName}
              onChange={(event) =>
                updateField('adminName', event.target.value)
              }
              autoComplete="name"
            />
          </label>

          <label>
            <span>Administrator email</span>
            <input
              required
              type="email"
              value={form.adminEmail}
              onChange={(event) =>
                updateField('adminEmail', event.target.value)
              }
              autoComplete="email"
            />
          </label>

          <label>
            <span>Administrator phone</span>
            <input
              required
              type="tel"
              value={form.adminPhone}
              onChange={(event) =>
                updateField('adminPhone', event.target.value)
              }
              autoComplete="tel"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="primary-button form-submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating organization...'
              : 'Register organization'}
          </button>
        </form>
      </div>
    </main>
  );
}
