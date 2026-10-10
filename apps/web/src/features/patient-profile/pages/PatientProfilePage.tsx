import { useCallback, useEffect, useState } from 'react';
import { getMyPatientDashboard } from '../../patient-dashboard/api/patient-dashboard.api.js';
import type { PatientDashboardResponse } from '../../patient-dashboard/types/patient-dashboard.types.js';
import * as api from '../api/patient-profile.api.js';

type SectionKey =
  | 'contact'
  | 'addresses'
  | 'emergencyContacts'
  | 'nextOfKin'
  | 'insurance'
  | 'corporateProfile';

type ProfileRecord = {
  id: string;
  [key: string]: unknown;
};

type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
};

type SectionConfig = {
  key: SectionKey;
  title: string;
  description: string;
  fields: Field[];
  singular: string;
};

const sections: SectionConfig[] = [
  {
    key: 'contact',
    title: 'Contact information',
    description: 'Contact details associated with your patient profile.',
    singular: 'contact details',
    fields: [
      { key: 'phone', label: 'Phone number', required: true, type: 'tel' },
      { key: 'alternativePhone', label: 'Alternative phone', type: 'tel' },
      { key: 'email', label: 'Email address', type: 'email' },
    ],
  },
  {
    key: 'addresses',
    title: 'Addresses',
    description: 'Maintain your residential and postal addresses.',
    singular: 'address',
    fields: [
      { key: 'county', label: 'County', required: true },
      { key: 'town', label: 'Town', required: true },
      { key: 'area', label: 'Area or estate' },
      { key: 'physicalAddress', label: 'Physical address', required: true, multiline: true },
      { key: 'postalAddress', label: 'Postal address' },
      { key: 'isPrimary', label: 'Primary address', type: 'checkbox' },
    ],
  },
  {
    key: 'emergencyContacts',
    title: 'Emergency contacts',
    description: 'People who may be contacted in an emergency.',
    singular: 'emergency contact',
    fields: [
      { key: 'name', label: 'Full name', required: true },
      { key: 'relationship', label: 'Relationship', required: true },
      { key: 'phone', label: 'Phone number', required: true, type: 'tel' },
      { key: 'alternativePhone', label: 'Alternative phone', type: 'tel' },
    ],
  },
  {
    key: 'nextOfKin',
    title: 'Next of kin',
    description: 'Your recorded next-of-kin details. These details alone do not grant account or medical-record access.',
    singular: 'next-of-kin contact',
    fields: [
      { key: 'name', label: 'Full name', required: true },
      { key: 'relationship', label: 'Relationship', required: true },
      { key: 'phone', label: 'Phone number', required: true, type: 'tel' },
      { key: 'email', label: 'Email address', type: 'email' },
      { key: 'address', label: 'Address', multiline: true },
    ],
  },
  {
    key: 'insurance',
    title: 'Health insurance',
    description: 'Manage the insurance and membership information you have provided.',
    singular: 'insurance record',
    fields: [
      { key: 'provider', label: 'Insurance provider', required: true },
      { key: 'memberNumber', label: 'Member number', required: true },
      { key: 'policyNumber', label: 'Policy number' },
      { key: 'principalMember', label: 'Principal member' },
      { key: 'relationshipToPrincipal', label: 'Relationship to principal member' },
      { key: 'validFrom', label: 'Valid from', type: 'date' },
      { key: 'validUntil', label: 'Valid until', type: 'date' },
    ],
  },
  {
    key: 'corporateProfile',
    title: 'Corporate healthcare',
    description: 'Employer and corporate healthcare details associated with your account.',
    singular: 'corporate profile',
    fields: [
      { key: 'company', label: 'Company or employer', required: true },
      { key: 'employeeNumber', label: 'Employee number' },
      { key: 'corporatePlan', label: 'Corporate plan' },
      { key: 'eligibilityInformation', label: 'Eligibility information (JSON)', multiline: true },
    ],
  },
];

const emptyData = (): Record<SectionKey, ProfileRecord[]> => ({
  contact: [],
  addresses: [],
  emergencyContacts: [],
  nextOfKin: [],
  insurance: [],
  corporateProfile: [],
});

function toRecord(value: unknown): ProfileRecord {
  return value as ProfileRecord;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function initialValue(field: Field, record?: ProfileRecord): string | boolean {
  const value = record?.[field.key];

  if (field.key === 'eligibilityInformation') {
    return value && typeof value === 'object'
      ? JSON.stringify(value, null, 2)
      : '';
  }

  if (field.type === 'checkbox') return value === true;
  if (field.type === 'date' && typeof value === 'string') return value.slice(0, 10);
  return typeof value === 'string' ? value : '';
}

export function PatientProfilePage({
  onNavigate,
  onLogout,
}: {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  const [dashboard, setDashboard] = useState<PatientDashboardResponse | null>(null);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<SectionKey, string>>>({});
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<{ section: SectionKey; id: string | null } | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const next = emptyData();
    const nextErrors: Partial<Record<SectionKey, string>> = {};

    const loaders: {
      key: SectionKey;
      load: () => Promise<unknown>;
      unwrap?: (value: unknown) => unknown;
    }[] = [
      { key: 'contact', load: api.getPatientContact, unwrap: (v) => v ? [v] : [] },
      { key: 'addresses', load: api.getPatientAddresses },
      { key: 'emergencyContacts', load: api.getEmergencyContacts },
      { key: 'nextOfKin', load: api.getNextOfKin },
      { key: 'insurance', load: api.getPatientInsurance },
      { key: 'corporateProfile', load: api.getCorporateProfile, unwrap: (v) => v ? [v] : [] },
    ];

    await Promise.all(loaders.map(async (loader) => {
      try {
        const result = await loader.load();
        const unwrapped = loader.unwrap ? loader.unwrap(result) : result;
        next[loader.key] = (Array.isArray(unwrapped) ? unwrapped : []).map(toRecord);
      } catch (error) {
        nextErrors[loader.key] = error instanceof Error
          ? error.message
          : 'Unable to load this section.';
      }
    }));

    setData(next);
    setErrors(nextErrors);

    try {
      setDashboard(await getMyPatientDashboard());
    } catch {
      // Profile sections remain usable if the overview endpoint is temporarily unavailable.
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function beginEdit(section: SectionConfig, record?: ProfileRecord) {
    const nextValues: Record<string, string | boolean> = {};
    for (const field of section.fields) {
      nextValues[field.key] = initialValue(field, record);
    }
    setValues(nextValues);
    setEditing({ section: section.key, id: record?.id ?? null });
    setNotice('');
  }

  async function saveSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setNotice('');
    setErrors((previous) => ({ ...previous, [editing.section]: undefined }));

    try {
      const section = sections.find((item) => item.key === editing.section);
      if (!section) return;

      const payload: Record<string, unknown> = {};
      for (const field of section.fields) {
        const value = values[field.key];
        if (field.key === 'eligibilityInformation') {
          const raw = typeof value === 'string' ? value.trim() : '';
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
              throw new Error('Eligibility information must be a JSON object.');
            }
            payload[field.key] = parsed;
          }
        } else if (field.type === 'checkbox') {
          payload[field.key] = value === true;
        } else if (typeof value === 'string' && value.trim()) {
          payload[field.key] = value.trim();
        }
      }

      const id = editing.id;
      switch (editing.section) {
        case 'contact':
          await api.savePatientContact(payload);
          break;
        case 'addresses':
          if (id) await api.updatePatientAddress(id, payload);
          else await api.createPatientAddress(payload);
          break;
        case 'emergencyContacts':
          if (id) await api.updateEmergencyContact(id, payload);
          else await api.createEmergencyContact(payload);
          break;
        case 'nextOfKin':
          if (id) await api.updateNextOfKin(id, payload);
          else await api.createNextOfKin(payload);
          break;
        case 'insurance':
          if (id) await api.updatePatientInsurance(id, payload);
          else await api.createPatientInsurance(payload);
          break;
        case 'corporateProfile':
          await api.saveCorporateProfile(payload);
          break;
      }

      setEditing(null);
      setNotice(`${section.title} saved.`);
      await loadProfile();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [editing.section]: error instanceof Error ? error.message : 'Unable to save changes.',
      }));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(section: SectionConfig, record: ProfileRecord) {
    if (!window.confirm(`Delete this ${section.singular}?`)) return;

    setNotice('');
    setErrors((previous) => ({ ...previous, [section.key]: undefined }));

    try {
      switch (section.key) {
        case 'contact': await api.deletePatientContact(); break;
        case 'addresses': await api.deletePatientAddress(record.id); break;
        case 'emergencyContacts': await api.deleteEmergencyContact(record.id); break;
        case 'nextOfKin': await api.deleteNextOfKin(record.id); break;
        case 'insurance': await api.deletePatientInsurance(record.id); break;
        case 'corporateProfile': await api.deleteCorporateProfile(); break;
      }
      setNotice(`${section.title} updated.`);
      await loadProfile();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [section.key]: error instanceof Error ? error.message : 'Unable to delete this record.',
      }));
    }
  }

  async function setPrimary(addressId: string) {
    try {
      await api.setPrimaryPatientAddress(addressId);
      setNotice('Primary address updated.');
      await loadProfile();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        addresses: error instanceof Error ? error.message : 'Unable to set primary address.',
      }));
    }
  }

  // Loading state moved inside main content container

  return (
    <div className="patient-app-shell">
      <aside className="patient-sidebar">
        <div className="patient-sidebar-brand">
          <div className="patient-brand-mark">R</div>
          <div><strong>REVALTRIX</strong><span>Patient</span></div>
        </div>

        <nav className="patient-sidebar-navigation" aria-label="Patient navigation">
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/dashboard')}>Overview</button>
          <button type="button" className="patient-nav-item active" aria-current="page">My profile</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/family')}>Family &amp; delegated access</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/appointments')}>Appointments</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/encounters')}>Care history</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/laboratory')}>Laboratory</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/prescriptions')}>Prescriptions</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/documents')}>Documents</button>
          <button type="button" className="patient-nav-item" onClick={() => onNavigate('/patient/access')}>Data access</button>
        </nav>

        <div className="patient-sidebar-footer">
          <div className="patient-user-summary">
            <strong>{dashboard?.patient.displayName ?? 'Revaltrix Patient'}</strong>
            <span>Revaltrix Patient</span>
          </div>
          <button type="button" className="patient-logout-button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <div className="patient-app-main">
        <header className="patient-topbar">
          <div>
            <span className="patient-topbar-label">Your healthcare account</span>
            <strong>My profile</strong>
          </div>
          {dashboard ? (
            <div className="patient-topbar-id">
              <span>Revaltrix Patient ID</span>
              <strong>{dashboard.patient.platformPatientId}</strong>
            </div>
          ) : null}
        </header>

        <main className="patient-app-content ml-64 patient-profile-content">
          {loading ? (
            <div className="patient-profile-loading" aria-live="polite">
              Loading your profile...
            </div>
          ) : (
            <>
          <section className="patient-dashboard-hero">
            <div>
              <p className="patient-dashboard-eyebrow">Your information</p>
              <h1>Manage your patient profile</h1>
              <p>Review and update your contact details, addresses, emergency contacts, next of kin, insurance, and corporate healthcare information.</p>
            </div>
          </section>

          {notice ? <div className="patient-profile-notice" role="status">{notice}</div> : null}

          {dashboard ? (
            <section className="patient-dashboard-card patient-profile-identity">
              <p className="patient-dashboard-eyebrow">Platform identity</p>
              <h2>{dashboard.patient.displayName}</h2>
              <p>Patient ID: {dashboard.patient.platformPatientId}</p>
              <p>{dashboard.patient.location ?? 'Location not provided'}</p>
              <div className="patient-profile-identities">
                {dashboard.identities.map((identity) => (
                  <span key={identity.type}>
                    {identity.type}: {identity.verified ? 'Verified' : 'Not verified'}
                  </span>
                ))}
              </div>
              <p className="patient-profile-help">Your platform identity is managed by Revaltrix. Contact and address details below are profile information; changing them does not automatically change your verified sign-in identity.</p>
            </section>
          ) : (
            <div className="patient-profile-help">Your profile information is available below. Platform identity details could not be loaded.</div>
          )}

          <div className="patient-profile-sections">
            {sections.map((section) => {
              const records = data[section.key];
              const isEditing = editing?.section === section.key;
              const isSingleton = section.key === 'contact' || section.key === 'corporateProfile';

              return (
                <section className="patient-dashboard-card patient-profile-section" key={section.key}>
                  <div className="patient-profile-section-heading">
                    <div>
                      <p className="patient-dashboard-eyebrow">Patient profile</p>
                      <h2>{section.title}</h2>
                      <p>{section.description}</p>
                    </div>
                    {!isEditing && !(isSingleton && records.length > 0) ? (
                      <button type="button" className="patient-dashboard-button" onClick={() => beginEdit(section)}>
                        Add
                      </button>
                    ) : null}
                    {!isEditing && isSingleton && records.length > 0 ? (
                      <button type="button" className="patient-dashboard-button secondary" onClick={() => beginEdit(section, records[0])}>
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {errors[section.key] ? (
                    <div className="patient-profile-error" role="alert">{errors[section.key]}</div>
                  ) : null}

                  {isEditing ? (
                    <form className="patient-profile-form" onSubmit={(event) => void saveSection(event)}>
                      <div className="patient-profile-fields">
                        {section.fields.map((field) => (
                          <label className={field.multiline ? 'patient-profile-field wide' : 'patient-profile-field'} key={field.key}>
                            <span>{field.label}{field.required ? ' *' : ''}</span>
                            {field.type === 'checkbox' ? (
                              <input
                                type="checkbox"
                                checked={values[field.key] === true}
                                onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.checked }))}
                              />
                            ) : field.multiline ? (
                              <textarea
                                rows={field.key === 'eligibilityInformation' ? 5 : 3}
                                required={field.required}
                                value={String(values[field.key] ?? '')}
                                onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
                              />
                            ) : (
                              <input
                                type={field.type ?? 'text'}
                                required={field.required}
                                value={String(values[field.key] ?? '')}
                                onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
                              />
                            )}
                          </label>
                        ))}
                      </div>
                      <div className="patient-profile-actions">
                        <button type="submit" className="patient-dashboard-button" disabled={saving}>
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button type="button" className="patient-dashboard-button secondary" disabled={saving} onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : records.length === 0 ? (
                    <div className="patient-dashboard-empty patient-profile-empty">
                      <p>No {section.title.toLowerCase()} have been added yet.</p>
                    </div>
                  ) : (
                    <div className="patient-profile-records">
                      {records.map((record) => (
                        <article className="patient-profile-record" key={record.id}>
                          <dl>
                            {section.fields
                              .filter((field) => record[field.key] !== null && record[field.key] !== undefined && record[field.key] !== '')
                              .map((field) => (
                                <div className="patient-profile-record-field" key={field.key}>
                                  <dt>{field.label}</dt>
                                  <dd>{displayValue(record[field.key])}</dd>
                                </div>
                              ))}
                          </dl>
                          {section.key === 'addresses' && record.isPrimary !== true ? (
                            <button type="button" className="patient-dashboard-button secondary" onClick={() => void setPrimary(record.id)}>
                              Set as primary
                            </button>
                          ) : null}
                          {!isSingleton ? (
                            <div className="patient-profile-actions">
                              <button type="button" className="patient-dashboard-button secondary" onClick={() => beginEdit(section, record)}>Edit</button>
                              <button type="button" className="patient-dashboard-button danger" onClick={() => void deleteRecord(section, record)}>Delete</button>
                            </div>
                          ) : (
                            <button type="button" className="patient-dashboard-button danger" onClick={() => void deleteRecord(section, record)}>Remove</button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <button type="button" className="patient-dashboard-button secondary" onClick={() => onNavigate('/patient/dashboard')}>
            Back to overview
          </button>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
