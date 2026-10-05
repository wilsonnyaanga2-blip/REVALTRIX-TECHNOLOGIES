import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
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

function getRelatedPatient(
  relationship: FamilyRelationship,
) {
  return relationship.direction === 'OUTGOING'
    ? relationship.relatedPatient
    : relationship.patient;
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

  const [targetPlatformPatientId, setTargetPlatformPatientId] = useState('');
  const [relationshipType, setRelationshipType] =
    useState<FamilyRelationshipType>('OTHER');
  const [reason, setReason] = useState('');

  const incomingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'INCOMING'),
    [requests],
  );

  const outgoingRequests = useMemo(
    () => requests.filter((request) => request.direction === 'OUTGOING'),
    [requests],
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
          : 'Unable to load your family relationships.',
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
            Family &amp; delegated access
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
            <h1>Family &amp; delegated access</h1>
            <p>
              Manage trusted family relationships connected to your
              Revaltrix patient identity.
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

        <section className="patient-family-security-notice">
          <strong>Important: family relationship is not medical-data access.</strong>
          <p>
            Adding a family member establishes a trusted relationship only.
            It does not automatically give that person access to your
            medical records, appointments, laboratory results, prescriptions,
            documents, or other protected health information. Delegated
            permissions are controlled separately.
          </p>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">NEW REQUEST</span>
              <h2>Add a family relationship</h2>
            </div>
          </div>

          <form className="patient-family-request-form" onSubmit={handleCreateRequest}>
            <label>
              <span>Revaltrix platform patient ID</span>
              <input
                value={targetPlatformPatientId}
                onChange={(event) =>
                  setTargetPlatformPatientId(event.target.value)
                }
                maxLength={50}
                placeholder="Enter the other patient's platform ID"
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
              <span>Reason <small>(optional)</small></span>
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
                {submitting ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">ACTIVE</span>
              <h2>Family relationships</h2>
            </div>
            <span className="patient-section-count">
              {relationships.length}
            </span>
          </div>

          {loading ? (
            <div className="patient-empty-state">Loading family relationships…</div>
          ) : relationships.length === 0 ? (
            <div className="patient-empty-state">
              You do not currently have any active family relationships.
            </div>
          ) : (
            <div className="patient-family-list">
              {relationships.map((relationship) => {
                const patient = getRelatedPatient(relationship);

                return (
                  <article
                    className="patient-family-card"
                    key={relationship.id}
                  >
                    <div>
                      <strong>{patientName(patient)}</strong>
                      <span>
                        {relationshipLabels[relationship.relationshipType]}
                      </span>
                      <small>
                        Platform ID: {patient.platformPatientId}
                      </small>
                      <small>
                        Added {formatDate(relationship.createdAt)}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="patient-dashboard-button danger"
                      disabled={actionId === relationship.id}
                      onClick={() => void handleRevoke(relationship)}
                    >
                      {actionId === relationship.id
                        ? 'Revoking…'
                        : 'Revoke relationship'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">INCOMING</span>
              <h2>Requests requiring your response</h2>
            </div>
            <span className="patient-section-count">
              {incomingRequests.length}
            </span>
          </div>

          {loading ? (
            <div className="patient-empty-state">Loading requests…</div>
          ) : incomingRequests.length === 0 ? (
            <div className="patient-empty-state">
              You have no pending incoming family requests.
            </div>
          ) : (
            <div className="patient-family-list">
              {incomingRequests.map((request) => (
                <article className="patient-family-card" key={request.id}>
                  <div>
                    <strong>
                      {patientName(request.requesterPatientProfile)}
                    </strong>
                    <span>
                      {relationshipLabels[request.relationshipType]}
                    </span>
                    <small>
                      Platform ID:{' '}
                      {request.requesterPatientProfile.platformPatientId}
                    </small>
                    {request.reason && <p>{request.reason}</p>}
                    <small>
                      Requested {formatDate(request.requestedAt)}
                      {request.expiresAt
                        ? ` · Expires ${formatDate(request.expiresAt)}`
                        : ''}
                    </small>
                  </div>

                  <div className="patient-family-actions">
                    <button
                      type="button"
                      className="patient-dashboard-button"
                      disabled={actionId === request.id}
                      onClick={() => void handleRespond(request, 'ACCEPT')}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="patient-dashboard-button secondary"
                      disabled={actionId === request.id}
                      onClick={() => void handleRespond(request, 'DECLINE')}
                    >
                      Decline
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="patient-profile-section">
          <div className="patient-section-heading">
            <div>
              <span className="patient-eyebrow">OUTGOING</span>
              <h2>Requests you have sent</h2>
            </div>
            <span className="patient-section-count">
              {outgoingRequests.length}
            </span>
          </div>

          {loading ? (
            <div className="patient-empty-state">Loading requests…</div>
          ) : outgoingRequests.length === 0 ? (
            <div className="patient-empty-state">
              You have no pending outgoing family requests.
            </div>
          ) : (
            <div className="patient-family-list">
              {outgoingRequests.map((request) => (
                <article className="patient-family-card" key={request.id}>
                  <div>
                    <strong>
                      {patientName(request.targetPatientProfile)}
                    </strong>
                    <span>
                      {relationshipLabels[request.relationshipType]}
                    </span>
                    <small>
                      Platform ID:{' '}
                      {request.targetPatientProfile.platformPatientId}
                    </small>
                    {request.reason && <p>{request.reason}</p>}
                    <small>
                      Requested {formatDate(request.requestedAt)}
                      {request.expiresAt
                        ? ` · Expires ${formatDate(request.expiresAt)}`
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
        </section>
      </main>
    </div>
  );
}
