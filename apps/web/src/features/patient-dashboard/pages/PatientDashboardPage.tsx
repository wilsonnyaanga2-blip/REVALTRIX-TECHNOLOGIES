import { useEffect, useState } from 'react';
import {
  approvePatientRelationshipRequest,
  declinePatientRelationshipRequest,
  getMyPatientDashboard,
} from '../api/patient-dashboard.api.js';
import type {
  PatientDashboardResponse,
  PatientRelationshipRequest,
} from '../types/patient-dashboard.types.js';

interface PatientDashboardPageProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const facilityTypeLabels: Record<string, string> = {
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
  REHABILITATION_CENTER: 'Rehabilitation',
  HOME_HEALTH_PROVIDER: 'Home Health Provider',
  AMBULANCE_PROVIDER: 'Ambulance Provider',
  HEALTHCARE_NETWORK: 'Healthcare Network',
  CORPORATE_HEALTH_PROVIDER: 'Corporate Health Provider',
  INSURER: 'Insurer',
  EXTERNAL_PROVIDER: 'External Provider',
  OTHER_HEALTHCARE_PROVIDER: 'Healthcare Provider',
};

function getFacilityType(type: string): string {
  return facilityTypeLabels[type] ?? 'Healthcare Provider';
}

function getRelationshipLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active relationship';
    case 'PENDING':
      return 'Pending';
    case 'INACTIVE':
      return 'Inactive';
    case 'SUSPENDED':
      return 'Suspended';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}

function RelationshipRequestCard({
  request,
  busyRequestId,
  onApprove,
  onDecline,
}: {
  request: PatientRelationshipRequest;
  busyRequestId: string | null;
  onApprove: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}) {
  const busy = busyRequestId === request.id;

  return (
    <article className="patient-dashboard-request-card">
      <div>
        <p className="patient-dashboard-eyebrow">
          Facility relationship request
        </p>
        <h3>{request.facility.name}</h3>
        <p>
          {getFacilityType(request.facility.type)}
          {' · '}
          Patient number {request.patientRecord.patientNumber}
        </p>

        {request.reason ? (
          <p className="patient-dashboard-request-reason">
            {request.reason}
          </p>
        ) : null}
      </div>

      <div className="patient-dashboard-request-actions">
        <button
          type="button"
          className="patient-dashboard-button"
          disabled={busy}
          onClick={() => onApprove(request.id)}
        >
          {busy ? 'Processing...' : 'Allow facility'}
        </button>

        <button
          type="button"
          className="patient-dashboard-button secondary"
          disabled={busy}
          onClick={() => onDecline(request.id)}
        >
          Decline
        </button>
      </div>
    </article>
  );
}

export function PatientDashboardPage({
  onNavigate,
  onLogout,
}: PatientDashboardPageProps) {
  const [dashboard, setDashboard] =
    useState<PatientDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  async function loadDashboard(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyPatientDashboard();
      setDashboard(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load your patient dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleApprove(requestId: string): Promise<void> {
    setBusyRequestId(requestId);
    setError(null);

    try {
      await approvePatientRelationshipRequest(requestId);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to approve this facility relationship.',
      );
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleDecline(requestId: string): Promise<void> {
    setBusyRequestId(requestId);
    setError(null);

    try {
      await declinePatientRelationshipRequest(requestId);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to decline this facility relationship.',
      );
    } finally {
      setBusyRequestId(null);
    }
  }

  if (loading) {
    return (
      <main className="patient-dashboard-loading">
        <p>Loading your Revaltrix patient dashboard...</p>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="patient-dashboard-page">
        <section className="patient-dashboard-error">
          <p className="patient-dashboard-eyebrow">REVALTRIX</p>
          <h1>Patient dashboard unavailable</h1>
          <p>{error ?? 'Unable to load your patient account.'}</p>
          <button
            type="button"
            className="patient-dashboard-button"
            onClick={() => void loadDashboard()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="patient-app-shell">
      <aside className="patient-sidebar">
        <div className="patient-sidebar-brand">
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
            className="patient-nav-item active"
          >
            Overview
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
          <div className="patient-user-summary">
            <strong>{dashboard.patient.displayName}</strong>
            <span>Revaltrix Patient</span>
          </div>

          <button
            type="button"
            className="patient-logout-button"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="patient-app-main">
        <header className="patient-topbar">
          <div>
            <span className="patient-topbar-label">
              Your healthcare account
            </span>
            <strong>
              Welcome, {dashboard.patient.firstName}
            </strong>
          </div>

          <div className="patient-topbar-id">
            <span>Revaltrix Patient ID</span>
            <strong>{dashboard.patient.platformPatientId}</strong>
          </div>
        </header>

        <main className="patient-app-content">
          {error ? (
            <div className="patient-dashboard-inline-error" role="alert">
              {error}
            </div>
          ) : null}

          <section className="patient-dashboard-hero">
            <div>
              <p className="patient-dashboard-eyebrow">
                Your healthcare identity
              </p>
              <h1>
                Your healthcare, connected securely.
              </h1>
              <p>
                Your Revaltrix patient identity stays with you while
                each healthcare facility maintains its own relationship
                with you.
              </p>
            </div>

            <div className="patient-dashboard-id-card">
              <span>Patient ID</span>
              <strong>{dashboard.patient.platformPatientId}</strong>
            </div>
          </section>

          <section className="patient-dashboard-grid">
            <article className="patient-dashboard-card">
              <p className="patient-dashboard-eyebrow">
                Profile
              </p>
              <h2>{dashboard.patient.displayName}</h2>
              <p>{dashboard.patient.location ?? 'Location not provided'}</p>

              <div className="patient-dashboard-meta">
                {dashboard.identities.map((identity) => (
                  <span key={identity.type}>
                    {identity.type}
                    {' · '}
                    {identity.verified ? 'Verified' : 'Not verified'}
                  </span>
                ))}
              </div>
            </article>

            <article className="patient-dashboard-card">
              <p className="patient-dashboard-eyebrow">
                Your facilities
              </p>
              <h2>{dashboard.facilities.length}</h2>
              <p>
                Healthcare facilities with a relationship to your
                Revaltrix patient identity.
              </p>
            </article>
          </section>

          {dashboard.pendingRelationshipRequests.length > 0 ? (
            <section className="patient-dashboard-section">
              <div className="patient-dashboard-section-header">
                <div>
                  <p className="patient-dashboard-eyebrow">
                    Action required
                  </p>
                  <h2>Facility relationship requests</h2>
                </div>
                <span className="patient-dashboard-count">
                  {dashboard.pendingRelationshipRequests.length}
                </span>
              </div>

              <div className="patient-dashboard-request-list">
                {dashboard.pendingRelationshipRequests.map((request) => (
                  <RelationshipRequestCard
                    key={request.id}
                    request={request}
                    busyRequestId={busyRequestId}
                    onApprove={(id) => void handleApprove(id)}
                    onDecline={(id) => void handleDecline(id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="patient-dashboard-section">
            <div className="patient-dashboard-section-header">
              <div>
                <p className="patient-dashboard-eyebrow">
                  Healthcare relationships
                </p>
                <h2>Your facilities</h2>
              </div>
            </div>

            {dashboard.facilities.length === 0 ? (
              <div className="patient-dashboard-empty">
                <h3>No healthcare facility relationships yet</h3>
                <p>
                  When a healthcare facility establishes a relationship
                  with your Revaltrix patient account, it will appear here.
                </p>
              </div>
            ) : (
              <div className="patient-dashboard-facility-list">
                {dashboard.facilities.map((facility) => (
                  <article
                    className="patient-dashboard-facility-card"
                    key={facility.patientRecordId}
                  >
                    <div>
                      <p className="patient-dashboard-eyebrow">
                        {getFacilityType(facility.facility.type)}
                      </p>
                      <h3>{facility.facility.name}</h3>
                      {facility.facility.legalName &&
                      facility.facility.legalName !== facility.facility.name ? (
                        <p>{facility.facility.legalName}</p>
                      ) : null}
                    </div>

                    <div className="patient-dashboard-facility-meta">
                      <span>
                        Patient number: {facility.patientNumber}
                      </span>
                      <span>
                        {getRelationshipLabel(
                          facility.relationshipStatus,
                        )}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
