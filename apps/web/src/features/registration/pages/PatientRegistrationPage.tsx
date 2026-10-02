import { useState } from 'react';
import { registerPatient } from '../api/registration.api.js';

interface PatientRegistrationPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function PatientRegistrationPage({
  onSuccess,
  onBack,
}: PatientRegistrationPageProps) {
  const [form, setForm] = useState({
    firstName: '',
    secondName: '',
    email: '',
    phone: '',
    location: '',
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
      await registerPatient(form);
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
          <p className="eyebrow">Patient registration</p>
          <h1>Create your patient account</h1>
          <p>
            Enter your basic information. You will verify your contact details
            and complete your profile after registration.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="form-grid">
            <label>
              <span>First name</span>
              <input
                required
                value={form.firstName}
                onChange={(event) =>
                  updateField('firstName', event.target.value)
                }
                autoComplete="given-name"
              />
            </label>

            <label>
              <span>Second name</span>
              <input
                required
                value={form.secondName}
                onChange={(event) =>
                  updateField('secondName', event.target.value)
                }
                autoComplete="family-name"
              />
            </label>
          </div>

          <label>
            <span>Email address</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            <span>Phone number</span>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              autoComplete="tel"
            />
          </label>

          <label>
            <span>Location</span>
            <input
              required
              value={form.location}
              onChange={(event) =>
                updateField('location', event.target.value)
              }
              autoComplete="address-level2"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="primary-button form-submit"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create patient account'}
          </button>
        </form>
      </div>
    </main>
  );
}
