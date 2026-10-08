import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  registerDependent,
  cancelFamilyRequest,
  createFamilyRequest,
  getFamilyRequests,
  getFamilyRelationships,
  respondToFamilyRequest,
  revokeFamilyRelationship,
} from '../api/patient-family.api.js';
import {
  FAMILY_RELATIONSHIP_TYPES,
  type FamilyRelationship,
  type FamilyRelationshipRequest,
  type FamilyRelationshipType,
  type CreateDependentRegistrationRequest,
} from '../types/patient-family.types.js';

const relationshipLabels: Record<FamilyRelationshipType, string> = {
  SPOUSE: 'Spouse',
  PARENT: 'Parent',
  CHILD: 'Child',
  SIBLING: 'Sibling',
  GRANDPARENT: 'Grandparent',
  GRANDCHILD: 'Grandchild',
  GUARDIAN: 'Guardian',
  DEPENDENT: 'Dependent',
  OTHER: 'Other',
};

function patientName(patient: {
  firstName: string;
  secondName: string | null;
}) {
  return [patient.firstName, patient.secondName].filter(Boolean).join(' ');
}

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRelatedPatient(relationship: FamilyRelationship) {
  return relationship.direction === 'OUTGOING'
    ? relationship.relatedPatient
    : relationship.patient;
}

function isChildRelationship(type: FamilyRelationshipType) {
  return type === 'CHILD' || type === 'DEPENDENT';
}

export function PatientFamilyPage({
  onNavigate,
  onLogout,
}: {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  const [relationships, setRelationships] = useState<FamilyRelationship[]>([]);
  const [requests, setRequests] = useState<FamilyRelationshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showChildRegistration, setShowChildRegistration] = useState(false);

  const [targetPlatformPatientId, setTargetPlatformPatientId] = useState('');
  const [relationshipType, setRelationshipType] =
    useState<FamilyRelationshipType>('OTHER');
  const [reason, setReason] = useState('');

  const [dependentFirstName, setDependentFirstName] = useState('');
  const [dependentSecondName, setDependentSecondName] = useState('');
  const [dependentDateOfBirth, setDependentDateOfBirth] = useState('');
  const [dependentRelationshipType, setDependentRelationshipType] =
    useState<'CHILD' | 'DEPENDENT'>('CHILD');
  const [dependentLocation, setDependentLocation] = useState('');
  const [dependentReason, setDependentReason] = useState('');
  const [dependentSubmitting, setDependentSubmitting] = useState(false);

  const dependentAge = useMemo(() => {
    if (!dependentDateOfBirth) {
      return null;
    }

    const birth = new Date(`${dependentDateOfBirth}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(birth.getTime()) || birth > today) {
      return null;
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return {
      years,
      months,
      isMinor: years < 18,
    };
  }, [dependentDateOfBirth]);


  const incomingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'INCOMING'),
    [requests],
  );

  const outgoingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'OUTGOING'),
    [requests],
  );

  const children = useMemo(
    () =>
      relationships.filter((relationship) =>
        isChildRelationship(relationship.relationshipType),
      ),
    [relationships],
  );

  const adults = useMemo(
    () => relationships.filter(
      (relationship) =>
        !isChildRelationship(relationship.relationshipType),
    ),
    [relationships],
  );

  async function loadFamilyData() {
    setLoading(true);
    setError(null);

    try {
      const [relationshipResponse, requestResponse] = await Promise.all([
        getFamilyRelationships(),
        getFamilyRequests(),
      ]);

      setRelationships(relationshipResponse.data);
      setRequests(requestResponse.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your family information.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFamilyData();
  }, []);

  async function handleCreateRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const patientId = targetPlatformPatientId.trim();
    const requestReason = reason.trim();

    if (!patientId) {
      setError('Enter the Revaltrix platform patient ID.');
      return;
    }

    if (patientId.length > 50) {
      setError('The platform patient ID cannot exceed 50 characters.');
      return;
    }

    if (requestReason.length > 1000) {
      setError('The reason cannot exceed 1,000 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createFamilyRequest({
        targetPlatformPatientId: patientId,
        relationshipType,
        ...(requestReason ? { reason: requestReason } : {}),
      });

      setTargetPlatformPatientId('');
      setRelationshipType('OTHER');
      setReason('');
      setShowAddMember(false);
      setSuccess('Family relationship request sent.');
      await loadFamilyData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the family relationship request.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterDependent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const firstName = dependentFirstName.trim();
    const secondName = dependentSecondName.trim();
    const dateOfBirth = dependentDateOfBirth.trim();
    const location = dependentLocation.trim();
    const registrationReason = dependentReason.trim();

    if (!firstName || !secondName) {
      setError('First name and second name are required.');
      return;
    }

    if (firstName.length > 100 || secondName.length > 100) {
      setError('Names cannot exceed 100 characters.');
      return;
    }

    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }

    const parsedDate = new Date(`${dateOfBirth}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      setError('Enter a valid date of birth.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate > today) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    if (location.length > 300) {
      setError('Location cannot exceed 300 characters.');
      return;
    }

    if (registrationReason.length > 1000) {
      setError('The reason cannot exceed 1,000 characters.');
      return;
    }

    const payload: CreateDependentRegistrationRequest = {
      firstName,
      secondName,
      dateOfBirth,
      relationshipType: dependentRelationshipType,
      ...(location ? { location } : {}),
      ...(registrationReason ? { reason: registrationReason } : {}),
    };

    setDependentSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerDependent(payload);

      setDependentFirstName('');
      setDependentSecondName('');
      setDependentDateOfBirth('');
      setDependentRelationshipType('CHILD');
      setDependentLocation('');
      setDependentReason('');
      setShowChildRegistration(false);

      const dependentName = [
        response.data.dependent.firstName,
        response.data.dependent.secondName,
      ]
        .filter(Boolean)
        .join(' ');

      setSuccess(
        `${dependentName} was registered with Revaltrix. Guardian authority is pending verification before protected dependent access can be used.`,
      );

      await loadFamilyData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to register the child or dependent.',
      );
    } finally {
      setDependentSubmitting(false);
    }
  }

  async function handleRespond(
    request: FamilyRelationshipRequest,
    response: 'ACCEPT' | 'DECLINE',
  ) {
    const responseReason =
      response === 'DECLINE'
        ? window.prompt('Optional reason for declining this request:') ?? ''
        : '';

    if (responseReason.length > 1000) {
      setError('The response reason cannot exceed 1,000 characters.');
      return;
    }

    setActionId(request.id);
    setError(null);
    setSuccess(null);

    try {
      await respondToFamilyRequest(request.id, {
        response,
        ...(responseReason.trim()
          ? { responseReason: responseReason.trim() }
          : {}),
      });

      setSuccess(
        response === 'ACCEPT'
          ? 'Family relationship request accepted.'
          : 'Family relationship request declined.',
      );

      await loadFamilyData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to respond to this request.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(request: FamilyRelationshipRequest) {
    if (
      !window.confirm(
        'Cancel this pending family relationship request?',
      )
    ) {
      return;
    }

    setActionId(request.id);
    setError(null);
    setSuccess(null);

    try {
      await cancelFamilyRequest(request.id);
      setSuccess('Family relationship request cancelled.');
      await loadFamilyData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel this request.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleRevoke(relationship: FamilyRelationship) {
    const patient = getRelatedPatient(relationship);

    if (
      !window.confirm(
        `Revoke the family relationship with ${patientName(patient)}?`,
      )
    ) {
      return;
    }

    const revokeReason =
      window.prompt('Optional reason for revoking this relationship:') ?? '';

    if (revokeReason.length > 500) {
      setError('The revoke reason cannot exceed 500 characters.');
      return;
    }

    setActionId(relationship.id);
    setError(null);
    setSuccess(null);

    try {
      await revokeFamilyRelationship(relationship.id, {
        ...(revokeReason.trim()
          ? { reason: revokeReason.trim() }
          : {}),
      });

      setSuccess('Family relationship revoked.');
      await loadFamilyData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to revoke this relationship.',
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="patient-dashboard-shell">
      <aside className="patient-sidebar">
        <div className="patient-brand">
          <div className="patient-brand-mark">R</div>
          <div>
            <strong>REVALTRIX</strong>
            <span>Patient</span>
          </div>
        </div>

        <nav
          className="patient-sidebar-navigation"
          aria-label="Patient navigation"
        >
          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/dashboard')}
          >
            Overview
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/profile')}
          >
            My profile
          </button>

          <button
            type="button"
            className="patient-nav-item active"
            aria-current="page"
          >
            My family
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/appointments')}
          >
            Appointments
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/encounters')}
          >
            Care history
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/laboratory')}
          >
            Laboratory
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/prescriptions')}
          >
            Prescriptions
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/documents')}
          >
            Documents
          </button>

          <button
            type="button"
            className="patient-nav-item"
            onClick={() => onNavigate('/patient/access')}
          >
            Data access
          </button>
        </nav>

        <div className="patient-sidebar-footer">
          <button
            type="button"
            className="patient-dashboard-button secondary"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="patient-dashboard-main">
        <header className="patient-dashboard-header">
          <div>
            <span className="patient-eyebrow">PATIENT ACCOUNT</span>
            <h1>My Family &amp; Care Circle</h1>
            <p>
              Keep the people you care about connected to Revaltrix.
              Register children, connect relatives, and manage family
              relationships safely from one place.
            </p>
          </div>

          <button
            type="button"
            className="patient-dashboard-button secondary"
            onClick={() => onNavigate('/patient/dashboard')}
          >
            Back to overview
          </button>
        </header>

        {error && (
          <div className="patient-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="patient-alert success" role="status">
            {success}
          </div>
        )}

        <section className="patient-family-hero">
          <div>
            <span className="patient-eyebrow">YOUR CARE CIRCLE</span>
            <h2>Family care starts with a trusted connection.</h2>
            <p>
              Connect people who already have Revaltrix identities or
              start the process of registering a child or dependent.
              Family relationships and medical-data permissions remain
              separate.
            </p>
          </div>

          <div className="patient-family-hero-actions">
            <button
              type="button"
              className="patient-dashboard-button"
              onClick={() => {
                setShowAddMember(true);
                setShowChildRegistration(false);
              }}
            >
              + Add family member
            </button>

            <button
              type="button"
              className="patient-dashboard-button secondary"
              onClick={() => {
                setShowChildRegistration(true);
                setShowAddMember(false);
              }}
            >
              + Register a child
            </button>
          </div>
        </section>

        <section className="patient-family-security-notice">
          <strong>
            Family relationship is not medical-data access.
          </strong>
          <p>
            Connecting someone to your family circle does not automatically
            give either person access to the other's medical records,
            appointments, laboratory results, prescriptions, documents, or
            other protected health information. Delegated permissions are
            controlled separately.
          </p>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">FAMILY OVERVIEW</span>
              <h2>Your care circle</h2>
            </div>
          </div>

          <div className="patient-family-stat-grid">
            <article className="patient-family-stat-card">
              <span>Family members</span>
              <strong>{loading ? '—' : relationships.length}</strong>
              <small>Active relationships</small>
            </article>

            <article className="patient-family-stat-card">
              <span>Adults</span>
              <strong>{loading ? '—' : adults.length}</strong>
              <small>Connected relatives</small>
            </article>

            <article className="patient-family-stat-card">
              <span>Children &amp; dependents</span>
              <strong>{loading ? '—' : children.length}</strong>
              <small>Family members needing care</small>
            </article>

            <article className="patient-family-stat-card">
              <span>Pending requests</span>
              <strong>
                {loading
                  ? '—'
                  : incomingRequests.length + outgoingRequests.length}
              </strong>
              <small>Awaiting action</small>
            </article>
          </div>
        </section>

        {showAddMember && (
          <section className="patient-profile-section">
            <div className="patient-section-heading">
              <div>
                <span className="patient-eyebrow">CONNECT</span>
                <h2>Add someone who already uses Revaltrix</h2>
              </div>

              <button
                type="button"
                className="patient-dashboard-button secondary"
                onClick={() => setShowAddMember(false)}
              >
                Close
              </button>
            </div>

            <p className="patient-family-helper">
              Ask the relative for their Revaltrix platform patient ID.
              They will receive a family relationship request and can
              accept or decline it from their own account.
            </p>

            <form
              className="patient-family-request-form"
              onSubmit={handleCreateRequest}
            >
              <label>
                <span>Revaltrix platform patient ID</span>
                <input
                  value={targetPlatformPatientId}
                  onChange={(event) =>
                    setTargetPlatformPatientId(event.target.value)
                  }
                  maxLength={50}
                  placeholder="Enter the patient's platform ID"
                  autoComplete="off"
                />
              </label>

              <label>
                <span>Relationship</span>
                <select
                  value={relationshipType}
                  onChange={(event) =>
                    setRelationshipType(
                      event.target.value as FamilyRelationshipType,
                    )
                  }
                >
                  {FAMILY_RELATIONSHIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {relationshipLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="patient-family-full-width">
                <span>
                  Reason <small>(optional)</small>
                </span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional context for the relationship request"
                />
              </label>

              <div className="patient-family-form-actions">
                <button
                  type="submit"
                  className="patient-dashboard-button"
                  disabled={submitting}
                >
                  {submitting ? 'Sending…' : 'Send family request'}
                </button>
              </div>
            </form>
          </section>
        )}

        {showChildRegistration && (
          <section className="patient-profile-section">
            <div className="patient-section-heading">
              <div>
                <span className="patient-eyebrow">CHILD REGISTRATION</span>
                <h2>Register a child or dependent</h2>
              </div>

              <button
                type="button"
                className="patient-dashboard-button secondary"
                onClick={() => setShowChildRegistration(false)}
              >
                Close
              </button>
            </div>

            <div className="patient-family-child-intro">
              <div className="patient-family-child-icon" aria-hidden="true">
                +
              </div>

              <div>
                <h3>Give your child their own Revaltrix identity</h3>
                <p>
                  A child should have their own platform patient identity.
                  Your family relationship and any delegated access are
                  recorded separately so that access can be controlled
                  appropriately.
                </p>
              </div>
            </div>

            <div className="patient-family-feature-grid">
              <article>
                <strong>Child identity</strong>
                <p>
                  The child will have an individual Revaltrix patient
                  identity rather than being stored as a duplicate adult
                  account.
                </p>
              </article>

              <article>
                <strong>Guardian relationship</strong>
                <p>
                  Parent or guardian relationships can be recorded
                  separately from the child's identity.
                </p>
              </article>

              <article>
                <strong>Controlled access</strong>
                <p>
                  A family relationship does not automatically unlock the
                  child's protected medical information.
                </p>
              </article>
            </div>

            <form
              className="patient-family-request-form"
              onSubmit={handleRegisterDependent}
            >
              <label>
                <span>First name</span>
                <input
                  value={dependentFirstName}
                  onChange={(event) =>
                    setDependentFirstName(event.target.value)
                  }
                  maxLength={100}
                  autoComplete="given-name"
                  placeholder="Child's first name"
                  disabled={dependentSubmitting}
                />
              </label>

              <label>
                <span>Second name</span>
                <input
                  value={dependentSecondName}
                  onChange={(event) =>
                    setDependentSecondName(event.target.value)
                  }
                  maxLength={100}
                  autoComplete="family-name"
                  placeholder="Child's second name"
                  disabled={dependentSubmitting}
                />
              </label>

              <label>
                <span>Date of birth</span>
                <input
                  type="date"
                  value={dependentDateOfBirth}
                  onChange={(event) =>
                    setDependentDateOfBirth(event.target.value)
                  }
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={dependentSubmitting}
                />
              </label>

              <label>
                <span>Relationship</span>
                <select
                  value={dependentRelationshipType}
                  onChange={(event) =>
                    setDependentRelationshipType(
                      event.target.value as 'CHILD' | 'DEPENDENT',
                    )
                  }
                  disabled={dependentSubmitting}
                >
                  <option value="CHILD">Child</option>
                  <option value="DEPENDENT">Adult dependent</option>
                </select>
              </label>

              <label className="patient-family-full-width">
                <span>
                  Location <small>(optional)</small>
                </span>
                <input
                  value={dependentLocation}
                  onChange={(event) =>
                    setDependentLocation(event.target.value)
                  }
                  maxLength={300}
                  autoComplete="off"
                  placeholder="Current location"
                  disabled={dependentSubmitting}
                />
              </label>

              <label className="patient-family-full-width">
                <span>
                  Registration context <small>(optional)</small>
                </span>
                <textarea
                  value={dependentReason}
                  onChange={(event) =>
                    setDependentReason(event.target.value)
                  }
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional context for registering this child or dependent"
                  disabled={dependentSubmitting}
                />
              </label>

              <div className="patient-family-full-width patient-family-registration-note">
                <strong>Important</strong>
                <p>
                  This creates the dependent's own Revaltrix patient identity.
                  It does not create a hospital relationship or grant medical
                  record access. Guardian authority is recorded separately and
                  must be verified before it can be used for protected access.
                </p>
              </div>

              <div className="patient-family-form-actions">
                <button
                  type="submit"
                  className="patient-dashboard-button"
                  disabled={dependentSubmitting}
                >
                  {dependentSubmitting
                    ? 'Registering…'
                    : 'Register child / dependent'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">PEOPLE IN YOUR CARE</span>
              <h2>Family members</h2>
            </div>

            <span className="patient-section-count">
              {relationships.length}
            </span>
          </div>

          {loading ? (
            <div className="patient-empty-state">
              Loading your family circle…
            </div>
          ) : relationships.length === 0 ? (
            <div className="patient-empty-state">
              <strong>Your family circle is ready when you are.</strong>
              <p>
                Connect a relative who already uses Revaltrix, or register
                a child or dependent directly from your care circle.
              </p>
              <button
                type="button"
                className="patient-dashboard-button"
                onClick={() => setShowAddMember(true)}
              >
                Add family member
              </button>
            </div>
          ) : (
            <div className="patient-family-member-grid">
              {relationships.map((relationship) => {
                const patient = getRelatedPatient(relationship);
                const child = isChildRelationship(
                  relationship.relationshipType,
                );

                return (
                  <article
                    className="patient-family-member-card"
                    key={relationship.id}
                  >
                    <div className="patient-family-member-avatar">
                      {patient.firstName.charAt(0).toUpperCase()}
                    </div>

                    <div className="patient-family-member-content">
                      <div className="patient-family-member-heading">
                        <div>
                          <strong>{patientName(patient)}</strong>
                          <span>
                            {relationshipLabels[
                              relationship.relationshipType
                            ]}
                          </span>
                        </div>

                        {child && (
                          <span className="patient-family-badge">
                            Child / dependent
                          </span>
                        )}
                      </div>

                      <small>
                        Revaltrix patient · ID {patient.platformPatientId}
                      </small>

                      <small>
                        Connected {formatDate(relationship.createdAt)}
                      </small>

                      <div className="patient-family-member-actions">
                        <button
                          type="button"
                          className="patient-dashboard-button secondary"
                          onClick={() =>
                            onNavigate('/patient/access')
                          }
                        >
                          Manage access
                        </button>

                        {relationship.patientCanRevoke && (
                          <button
                            type="button"
                            className="patient-dashboard-button danger"
                            disabled={actionId === relationship.id}
                            onClick={() =>
                              void handleRevoke(relationship)
                            }
                          >
                            {actionId === relationship.id
                              ? 'Revoking…'
                              : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">THINGS TO REMEMBER</span>
              <h2>Family reminders</h2>
            </div>
          </div>

          <div className="patient-family-empty-feature">
            <strong>No family reminders yet</strong>
            <p>
              Appointment reminders, follow-ups, vaccination reminders and
              other family care tasks will appear here once the corresponding
              care data is available to your account.
            </p>
          </div>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">FAMILY ACTIVITY</span>
              <h2>Recent care activity</h2>
            </div>
          </div>

          <div className="patient-family-empty-feature">
            <strong>No family activity to show</strong>
            <p>
              Care activity will appear here when authorized family events,
              appointments and care interactions are available. Only
              information you are permitted to see will be shown.
            </p>
          </div>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">FAMILY SAFETY</span>
              <h2>Keep important information ready</h2>
            </div>
          </div>

          <div className="patient-family-feature-grid">
            <article>
              <strong>Emergency information</strong>
              <p>
                Keep emergency contacts and relevant safety information
                current in each patient's profile.
              </p>
              <button
                type="button"
                className="patient-dashboard-button secondary"
                onClick={() => onNavigate('/patient/profile')}
              >
                Open my profile
              </button>
            </article>

            <article>
              <strong>Insurance information</strong>
              <p>
                Insurance and coverage details should remain current before
                care is needed.
              </p>
              <button
                type="button"
                className="patient-dashboard-button secondary"
                onClick={() => onNavigate('/patient/profile')}
              >
                Review profile
              </button>
            </article>

            <article>
              <strong>Privacy controls</strong>
              <p>
                Family relationships are separate from delegated medical-data
                permissions.
              </p>
              <button
                type="button"
                className="patient-dashboard-button secondary"
                onClick={() => onNavigate('/patient/access')}
              >
                Manage data access
              </button>
            </article>
          </div>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">FAMILY REQUESTS</span>
              <h2>Requests needing attention</h2>
            </div>
          </div>

          <div className="patient-family-request-columns">
            <div>
              <h3>Incoming · {incomingRequests.length}</h3>

              {loading ? (
                <div className="patient-empty-state">Loading…</div>
              ) : incomingRequests.length === 0 ? (
                <div className="patient-empty-state">
                  No incoming family requests.
                </div>
              ) : (
                <div className="patient-family-list">
                  {incomingRequests.map((request) => (
                    <article
                      className="patient-family-card"
                      key={request.id}
                    >
                      <div>
                        <strong>
                          {patientName(request.requesterPatientProfile)}
                        </strong>

                        <span>
                          {relationshipLabels[request.relationshipType]}
                        </span>

                        <small>
                          ID:{' '}
                          {
                            request.requesterPatientProfile
                              .platformPatientId
                          }
                        </small>

                        {request.reason && <p>{request.reason}</p>}

                        <small>
                          Requested {formatDate(request.requestedAt)}
                          {request.expiresAt
                            ? ` · Expires ${formatDate(
                                request.expiresAt,
                              )}`
                            : ''}
                        </small>
                      </div>

                      <div className="patient-family-actions">
                        <button
                          type="button"
                          className="patient-dashboard-button"
                          disabled={actionId === request.id}
                          onClick={() =>
                            void handleRespond(request, 'ACCEPT')
                          }
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          className="patient-dashboard-button secondary"
                          disabled={actionId === request.id}
                          onClick={() =>
                            void handleRespond(request, 'DECLINE')
                          }
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3>Outgoing · {outgoingRequests.length}</h3>

              {loading ? (
                <div className="patient-empty-state">Loading…</div>
              ) : outgoingRequests.length === 0 ? (
                <div className="patient-empty-state">
                  No outgoing family requests.
                </div>
              ) : (
                <div className="patient-family-list">
                  {outgoingRequests.map((request) => (
                    <article
                      className="patient-family-card"
                      key={request.id}
                    >
                      <div>
                        <strong>
                          {patientName(request.targetPatientProfile)}
                        </strong>

                        <span>
                          {relationshipLabels[request.relationshipType]}
                        </span>

                        <small>
                          ID:{' '}
                          {
                            request.targetPatientProfile
                              .platformPatientId
                          }
                        </small>

                        {request.reason && <p>{request.reason}</p>}

                        <small>
                          Requested {formatDate(request.requestedAt)}
                          {request.expiresAt
                            ? ` · Expires ${formatDate(
                                request.expiresAt,
                              )}`
                            : ''}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="patient-dashboard-button secondary"
                        disabled={actionId === request.id}
                        onClick={() => void handleCancel(request)}
                      >
                        {actionId === request.id
                          ? 'Cancelling…'
                          : 'Cancel request'}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">YOUR FAMILY'S PRIVACY</span>
              <h2>Relationships and permissions stay separate</h2>
            </div>
          </div>

          <div className="patient-family-privacy-grid">
            <article>
              <span className="patient-family-privacy-icon">01</span>
              <strong>Family relationship</strong>
              <p>
                Confirms that two Revaltrix patients have an accepted family
                connection.
              </p>
            </article>

            <article>
              <span className="patient-family-privacy-icon">02</span>
              <strong>Delegated access</strong>
              <p>
                Determines whether another person may access specific
                protected information or perform permitted actions.
              </p>
            </article>

            <article>
              <span className="patient-family-privacy-icon">03</span>
              <strong>Your control</strong>
              <p>
                Access should be granted, reviewed and revoked through
                explicit authorization rather than inferred from a family
                relationship.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
