import { useEffect, useState } from 'react';
import {
  approvePatientRelationshipRequest,
  declinePatientRelationshipRequest,
  getMyPatientDashboard,
  getMyPatientJourney,
} from '../api/patient-dashboard.api.js';
import {
  acknowledgeMyQueueCall,
  getMyNotifications,
  markNotificationAsRead,
} from '../../notifications/api/notifications.api.js';
import { QueueCallAlert } from '../../notifications/components/QueueCallAlert.js';
import { PatientNotificationBell } from '../../notifications/components/PatientNotificationBell.js';
import { enableNotificationSound, playNotificationSound } from '../../notifications/utils/notification-sound.js';
import type {
  PatientDashboardResponse,
  PatientJourneyResponse,
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
  const [journey, setJourney] =
    useState<PatientJourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof getMyNotifications>>
  >([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  async function loadJourney(): Promise<void> {
    try {
      const response = await getMyPatientJourney();
      setJourney(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to refresh your care journey.',
      );
    }
  }

  async function loadNotifications(): Promise<void> {
    try {
      const nextNotifications = await getMyNotifications(false);
      setNotifications(nextNotifications);
    } catch {
      // Notification availability must not break the patient dashboard.
    }
  }

  async function loadDashboard(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyPatientDashboard();
      setDashboard(response);
      await loadJourney();
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
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadJourney();
      void loadNotifications();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  async function enableSound(): Promise<void> {
    try {
      await enableNotificationSound();
      setSoundEnabled(true);
    } catch {
      setSoundEnabled(false);
    }
  }

  const queueCallNotification =
    notifications.find(
      (notification) =>
        notification.type === 'QUEUE_PATIENT_CALLED' &&
        notification.readAt === null,
    ) ?? null;

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  useEffect(() => {
    if (!queueCallNotification || !soundEnabled) {
      return;
    }

    void playNotificationSound();
  }, [queueCallNotification?.id, soundEnabled]);

  async function handleQueueCallAcknowledge(): Promise<void> {
    if (!queueCallNotification) {
      return;
    }

    const entryId = queueCallNotification.data?.queueEntryId;

    if (typeof entryId !== 'string') {
      await markNotificationAsRead(queueCallNotification.id);
      await loadNotifications();
      return;
    }

    try {
      await acknowledgeMyQueueCall(entryId);
      await markNotificationAsRead(queueCallNotification.id);
      await loadNotifications();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to acknowledge the queue call.',
      );
    }
  }

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
      {queueCallNotification ? (
        <QueueCallAlert
          notification={queueCallNotification}
          onAcknowledge={() => void handleQueueCallAcknowledge()}
        />
      ) : null}

      <div className="patient-dashboard-notification-controls">
        <PatientNotificationBell
          unreadCount={unreadCount}
          onClick={() => void loadNotifications()}
        />

        <button
          type="button"
          className="patient-dashboard-button secondary"
          onClick={() => void enableSound()}
        >
          {soundEnabled ? '🔊 Sound enabled' : '🔇 Enable sound'}
        </button>
      </div>
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
            onClick={() => onNavigate('/patient/profile')}
          >
            My profile
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

          {journey?.data?.length ? (
            <section className="patient-dashboard-section">
              <div className="patient-dashboard-section-header">
                <div>
                  <p className="patient-dashboard-eyebrow">
                    Live patient journey
                  </p>
                  <h2>Where you are now</h2>
                </div>
              </div>

              {journey.data.map((activeJourney) => {
                const current = activeJourney.current;
                const queueEntry = current?.queueEntry;

                return (
                  <article
                    className="patient-dashboard-card"
                    key={activeJourney.journey.id}
                  >
                    <div>
                      <p className="patient-dashboard-eyebrow">
                        {activeJourney.journey.status === 'COMPLETED'
                          ? 'Care journey complete'
                          : 'Current step'}
                      </p>

                      <h2>
                        {current?.department?.name ??
                          current?.queue?.name ??
                          current?.name ??
                          'Treatment complete'}
                      </h2>

                      {current?.branch?.name ? (
                        <p>{current.branch.name}</p>
                      ) : null}

                      {current?.location ? (
                        <p>
                          <strong>Where to go:</strong>{' '}
                          {current.location}
                        </p>
                      ) : null}

                      {current?.instruction ? (
                        <p>
                          <strong>What to do:</strong>{' '}
                          {current.instruction}
                        </p>
                      ) : null}
                      {current?.queueEntry?.reason ? (
                        <p>
                          <strong>Reason for visit:</strong>{' '}
                          {current.queueEntry.reason}
                        </p>
                      ) : null}
                    </div>

                    <div className="patient-dashboard-meta">
                      {queueEntry ? (
                        <>
                          <span>
                            Queue number: {queueEntry.queueNumber}
                          </span>
                          <span>
                            {queueEntry.status === 'WAITING' ||
                            queueEntry.status === 'CREATED'
                              ? `Current position: ${queueEntry.position ?? 'Calculating'}`
                              : queueEntry.status === 'CALLED'
                                ? 'You have been called; proceed to the service point.'
                                : 'Service is in progress.'}
                          </span>
                          <span>
                            Status:{' '}
                            {queueEntry.status.replaceAll('_', ' ')}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {current?.estimatedWaitMinutes !== null &&
                    current?.estimatedWaitMinutes !== undefined ? (
                      <div className="patient-dashboard-meta">
                        <span>
                          Estimated wait:{' '}
                          {current.estimatedWaitMinutes === 0
                            ? 'You are being served'
                            : `~${current.estimatedWaitMinutes} minutes`}
                        </span>
                      </div>
                    ) : null}

                    {activeJourney.next ? (
                      <div className="patient-dashboard-meta">
                        <span>
                          Next: {activeJourney.next.department?.name ??
                            activeJourney.next.name}
                        </span>
                      </div>
                    ) : null}

                    <div className="patient-dashboard-meta">
                      <strong>Care pathway</strong>
                      <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                        {activeJourney.steps.map((step) => (
                          <li key={step.id} style={{ marginBottom: '0.35rem' }}>
                            <span>
                              {step.department?.name ?? step.name}
                            </span>
                            {' — '}
                            <span>
                              {step.status === 'COMPLETED'
                                ? 'Completed'
                                : step.id === current?.id
                                  ? 'Active step'
                                  : step.status.replaceAll('_', ' ')}
                            </span>
                            {step.queueEntry?.queueNumber &&
                            step.id === current?.id ? (
                              <span>
                                {' · '}Queue {step.queueEntry.queueNumber}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}

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
