import { FormEvent, useEffect, useState } from 'react';
import {
  getOrganization,
  updateOrganization,
} from '../api/organization.api.js';
import type {
  OrganizationResponse,
  UpdateOrganizationInput,
} from '../types/organization.types.js';

interface OrganizationPageProps {
  onNavigate?: (path: string) => void;
}

const tenantTypeLabels: Record<string, string> = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  SPECIALIST_PRACTICE: 'Specialist Practice',
  MEDICAL_CENTER: 'Medical Center',
  DIAGNOSTIC_CENTER: 'Diagnostic Center',
  LABORATORY: 'Laboratory',
  RADIOLOGY_CENTER: 'Radiology Center',
  PHARMACY: 'Pharmacy',
  DENTAL_CLINIC: 'Dental Clinic',
  OPTICAL_CENTER: 'Optical Center',
  MATERNITY_CENTER: 'Maternity Center',
  REHABILITATION_CENTER: 'Rehabilitation Center',
  HOME_HEALTH_PROVIDER: 'Home Health Provider',
  AMBULANCE_PROVIDER: 'Ambulance Provider',
  HEALTHCARE_NETWORK: 'Healthcare Network',
  CORPORATE_HEALTH_PROVIDER: 'Corporate Health Provider',
  INSURER: 'Insurer',
  EXTERNAL_PROVIDER: 'External Provider',
  OTHER_HEALTHCARE_PROVIDER: 'Other Healthcare Provider',
};

interface FormState {
  businessName: string;
  legalName: string;
  registrationNumber: string;
  taxIdentificationNumber: string;
  country: string;
  county: string;
  subcounty: string;
  address: string;
  postalCode: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  ownershipType: string;
}

function toFormState(
  result: OrganizationResponse,
): FormState {
  return {
    businessName:
      result.profile?.businessName ?? result.tenant.name,
    legalName:
      result.profile?.legalName ?? result.tenant.legalName ?? '',
    registrationNumber:
      result.profile?.registrationNumber ?? '',
    taxIdentificationNumber:
      result.profile?.taxIdentificationNumber ?? '',
    country: result.profile?.country ?? 'Kenya',
    county: result.profile?.county ?? '',
    subcounty: result.profile?.subcounty ?? '',
    address: result.profile?.address ?? '',
    postalCode: result.profile?.postalCode ?? '',
    website: result.profile?.website ?? '',
    contactEmail: result.profile?.contactEmail ?? '',
    contactPhone: result.profile?.contactPhone ?? '',
    description: result.profile?.description ?? '',
    ownershipType: result.profile?.ownershipType ?? '',
  };
}

export function OrganizationPage({
  onNavigate,
}: OrganizationPageProps) {
  const [organization, setOrganization] =
    useState<OrganizationResponse | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const result = await getOrganization();

        if (cancelled) {
          return;
        }

        setOrganization(result);
        setForm(toFormState(result));
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load organization information.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(
    field: keyof FormState,
    value: string,
  ): void {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!form) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const input: UpdateOrganizationInput = {
      businessName: form.businessName.trim(),
      legalName: form.legalName.trim(),
      registrationNumber: form.registrationNumber.trim(),
      taxIdentificationNumber:
        form.taxIdentificationNumber.trim(),
      country: form.country.trim(),
      county: form.county.trim(),
      subcounty: form.subcounty.trim(),
      address: form.address.trim(),
      postalCode: form.postalCode.trim(),
      website: form.website.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      description: form.description.trim(),
      ownershipType: form.ownershipType.trim(),
    };

    try {
      const result = await updateOrganization(input);

      setOrganization(result);
      setForm(toFormState(result));
      setSuccess('Organization information saved successfully.');

      onNavigate?.('/tenant/organization');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save organization information.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="tenant-module-page">
        <div className="tenant-dashboard-loading">
          <p>Loading organization information...</p>
        </div>
      </section>
    );
  }

  if (error && !form) {
    return (
      <section className="tenant-module-page">
        <div className="tenant-dashboard-error">
          <h1>Organization unavailable</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!organization || !form) {
    return null;
  }

  return (
    <section className="tenant-module-page">
      <header className="tenant-module-header">
        <div>
          <p className="dashboard-eyebrow">
            Organization
          </p>
          <h1>Organization information</h1>
          <p>
            Maintain the official identity and contact information
            used across your Revaltrix workspace.
          </p>
        </div>

        <div className="tenant-module-meta">
          <strong>
            {tenantTypeLabels[organization.tenant.type] ??
              organization.tenant.type}
          </strong>
          <span>Code: {organization.tenant.code}</span>
        </div>
      </header>

      {error && (
        <div className="tenant-form-alert tenant-form-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="tenant-form-alert tenant-form-alert-success">
          {success}
        </div>
      )}

      <form
        className="tenant-organization-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="dashboard-card-label">
                Identity
              </p>
              <h2>Organization identity</h2>
            </div>
          </div>

          <div className="tenant-form-grid">
            <label>
              <span>Business name</span>
              <input
                value={form.businessName}
                onChange={(event) =>
                  updateField('businessName', event.target.value)
                }
                required
                minLength={2}
                maxLength={200}
              />
            </label>

            <label>
              <span>Legal name</span>
              <input
                value={form.legalName}
                onChange={(event) =>
                  updateField('legalName', event.target.value)
                }
                required
                minLength={2}
                maxLength={300}
              />
            </label>

            <label>
              <span>Registration number</span>
              <input
                value={form.registrationNumber}
                onChange={(event) =>
                  updateField(
                    'registrationNumber',
                    event.target.value,
                  )
                }
                maxLength={150}
              />
            </label>

            <label>
              <span>Tax identification number</span>
              <input
                value={form.taxIdentificationNumber}
                onChange={(event) =>
                  updateField(
                    'taxIdentificationNumber',
                    event.target.value,
                  )
                }
                maxLength={150}
              />
            </label>

            <label>
              <span>Ownership type</span>
              <input
                value={form.ownershipType}
                onChange={(event) =>
                  updateField('ownershipType', event.target.value)
                }
                maxLength={100}
                placeholder="e.g. Private, Public, NGO"
              />
            </label>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="dashboard-card-label">
                Location
              </p>
              <h2>Organization location</h2>
            </div>
          </div>

          <div className="tenant-form-grid">
            <label>
              <span>Country</span>
              <input
                value={form.country}
                onChange={(event) =>
                  updateField('country', event.target.value)
                }
                required
                maxLength={100}
              />
            </label>

            <label>
              <span>County</span>
              <input
                value={form.county}
                onChange={(event) =>
                  updateField('county', event.target.value)
                }
                maxLength={100}
              />
            </label>

            <label>
              <span>Subcounty</span>
              <input
                value={form.subcounty}
                onChange={(event) =>
                  updateField('subcounty', event.target.value)
                }
                maxLength={100}
              />
            </label>

            <label>
              <span>Postal code</span>
              <input
                value={form.postalCode}
                onChange={(event) =>
                  updateField('postalCode', event.target.value)
                }
                maxLength={30}
              />
            </label>

            <label className="tenant-form-field-wide">
              <span>Physical address</span>
              <input
                value={form.address}
                onChange={(event) =>
                  updateField('address', event.target.value)
                }
                maxLength={500}
              />
            </label>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="dashboard-card-label">
                Official contacts
              </p>
              <h2>Contact information</h2>
            </div>
          </div>

          <div className="tenant-form-grid">
            <label>
              <span>Official email</span>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  updateField('contactEmail', event.target.value)
                }
                maxLength={320}
              />
            </label>

            <label>
              <span>Official phone</span>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) =>
                  updateField('contactPhone', event.target.value)
                }
                maxLength={50}
              />
            </label>

            <label className="tenant-form-field-wide">
              <span>Website</span>
              <input
                type="url"
                value={form.website}
                onChange={(event) =>
                  updateField('website', event.target.value)
                }
                maxLength={500}
                placeholder="https://example.com"
              />
            </label>

            <label className="tenant-form-field-wide">
              <span>Organization description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                maxLength={1000}
                rows={5}
              />
            </label>
          </div>
        </div>

        <div className="tenant-form-actions">
          <button
            type="button"
            className="tenant-secondary-action"
            onClick={() =>
              onNavigate?.('/dashboard')
            }
            disabled={saving}
          >
            Back to dashboard
          </button>

          <button
            type="submit"
            className="tenant-primary-action"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save organization'}
          </button>
        </div>
      </form>
    </section>
  );
}
