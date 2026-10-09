import { useEffect, useState } from 'react';
import {
  approvePatientRelationshipRequest,
  declinePatientRelationshipRequest,
  getMyPatientDashboard,
  getMyPatientJourney,
  getMyCareHistory,
} from '../api/patient-dashboard.api.js';
import {
  acknowledgeMyQueueCall,
  deleteWebPushSubscription,
  getWebPushPublicKey,
  getMyNotifications,
  markNotificationAsRead,
  saveWebPushSubscription,
} from '../../notifications/api/notifications.api.js';
import { QueueCallAlert } from '../../notifications/components/QueueCallAlert.js';
import { PatientNotificationBell } from '../../notifications/components/PatientNotificationBell.js';
import { enableNotificationSound, playNotificationSound } from '../../notifications/utils/notification-sound.js';
import type {
  PatientDashboardResponse,
  PatientJourneyResponse,
  CareHistoryResponse,
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

function decodePushKey(key: string): ArrayBuffer {
  const padding = '='.repeat((4 - (key.length % 4)) % 4);
  const base64 = `${key}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const binary = window.atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return buffer;
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
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isOverviewContent =
    currentPath === '/patient' || currentPath === '/patient/dashboard';
  const isActivePath = (path: string) =>
    path === '/patient/dashboard'
      ? currentPath === '/patient' || currentPath === '/patient/dashboard'
      : currentPath === path;
  const [dashboard, setDashboard] =
    useState<PatientDashboardResponse | null>(null);
  const [journey, setJourney] =
    useState<PatientJourneyResponse | null>(null);
  const [careHistory, setCareHistory] =
    useState<CareHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof getMyNotifications>>
  >([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const [showJourneyDetails, setShowJourneyDetails] = useState(false);
  const [showCareHistory, setShowCareHistory] = useState(false);

  const activeJourneys =
    journey?.data?.filter(
      (item) =>
        item.journey.status === 'ACTIVE' &&
        item.current !== null &&
        !['COMPLETED', 'CANCELLED'].includes(item.current.status),
    ) ?? [];

  const completedJourneys =
    journey?.data?.filter(
      (item) =>
        item.journey.status === 'COMPLETED' ||
        item.current?.status === 'COMPLETED',
    ) ?? [];

  const currentJourney =
    activeJourneys.find(
      (item) => item.current?.queueEntry?.status === 'CALLED',
    ) ??
    activeJourneys.find(
      (item) => item.current?.queueEntry?.status === 'IN_SERVICE',
    ) ??
    activeJourneys.find(
      (item) => item.current?.queueEntry?.status === 'WAITING',
    ) ??
    activeJourneys.find(
      (item) => item.current?.queueEntry?.status === 'CREATED',
    ) ??
    activeJourneys[0] ??
    null;


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

  async function loadCareHistory(): Promise<void> {
    try {
      const response = await getMyCareHistory();
      setCareHistory(response);
    } catch {
      // Keep the main dashboard usable if history temporarily fails.
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

  async function loadDashboard(
    showLoading = true,
    loadRelatedContent = true,
  ): Promise<void> {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getMyPatientDashboard();
      setDashboard(response);
      if (loadRelatedContent) {
        await loadJourney();
        await loadCareHistory();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load your patient dashboard.',
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function refreshOpenContent(): Promise<void> {
    setRefreshing(true);
    setError(null);

    try {
      if (isOverviewContent) {
        const [dashboardResponse, journeyResponse] = await Promise.all([
          getMyPatientDashboard(),
          getMyPatientJourney(),
        ]);
        setDashboard(dashboardResponse);
        setJourney(journeyResponse);
      } else if (currentPath === '/patient/encounters') {
        setCareHistory(await getMyCareHistory());
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to refresh this section.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    void loadNotifications();
    void navigator.serviceWorker?.getRegistration().then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      setPushEnabled(subscription !== null && subscription !== undefined);
    });

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
  const referralNotification =
    notifications.find(
      (notification) =>
        notification.type === 'PATIENT_DEPARTMENT_REFERRED' &&
        notification.readAt === null,
    ) ?? null;

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  useEffect(() => {
    const alertNotification = queueCallNotification ?? referralNotification;

    if (!alertNotification || !soundEnabled) {
      return;
    }

    void playNotificationSound();
  }, [queueCallNotification?.id, referralNotification?.id, soundEnabled]);

  async function enableWebPush(): Promise<void> {
    setPushBusy(true);
    setPushError(null);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Web push is not supported by this browser.');
      }

      const publicKey = await getWebPushPublicKey();

      if (!publicKey) {
        throw new Error('Web push is not configured for this facility.');
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Allow notifications in your browser to enable web push.');
      }

      await navigator.serviceWorker.register('/service-worker.js');
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodePushKey(publicKey),
        });
      }

      const subscriptionJson = subscription.toJSON();

      if (
        !subscription.endpoint ||
        !subscriptionJson.keys?.p256dh ||
        !subscriptionJson.keys.auth
      ) {
        throw new Error('The browser returned an incomplete push subscription.');
      }

      await saveWebPushSubscription({
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      });
      setPushEnabled(true);
    } catch (requestError) {
      setPushError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to enable web push notifications.',
      );
    } finally {
      setPushBusy(false);
    }
  }

  async function disableWebPush(): Promise<void> {
    setPushBusy(true);
    setPushError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const subscriptionJson = subscription.toJSON();
        const p256dh = subscriptionJson.keys?.p256dh;
        const auth = subscriptionJson.keys?.auth;

        if (subscription.endpoint && p256dh && auth) {
          await deleteWebPushSubscription(subscription.endpoint, { p256dh, auth });
        }

        await subscription.unsubscribe();
      }

      setPushEnabled(false);
    } catch (requestError) {
      setPushError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to disable web push notifications.',
      );
    } finally {
      setPushBusy(false);
    }
  }

  async function dismissReferralNotification(): Promise<void> {
    if (!referralNotification) {
      return;
    }

    try {
      await markNotificationAsRead(referralNotification.id);
      await loadNotifications();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to dismiss the referral notification.',
      );
    }
  }

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
      await loadDashboard(false, false);
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
      await loadDashboard(false, false);
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

  if (!dashboard) {
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
    <div
      className={`patient-app-shell ${sidebarCollapsed ? 'patient-sidebar-collapsed' : ''}`}
    >
      {queueCallNotification ? (
        <QueueCallAlert
          notification={queueCallNotification}
          onAcknowledge={() => void handleQueueCallAcknowledge()}
        />
      ) : null}
      {referralNotification ? (
        <section
          role="alert"
          aria-live="assertive"
          className="patient-queue-call-alert"
        >
          <div>
            <p className="patient-dashboard-eyebrow">REFERRAL UPDATE</p>
            <h2>{referralNotification.title}</h2>
            <p>{referralNotification.body}</p>
          </div>
          <button
            type="button"
            className="patient-dashboard-button"
            onClick={() => void dismissReferralNotification()}
          >
            Dismiss
          </button>
        </section>
      ) : null}

      <aside
        className={`patient-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div className="patient-sidebar-brand">
          <div className="patient-brand-mark">R</div>
          <div className="patient-sidebar-brand-copy">
            <strong>REVALTRIX</strong>
            <span>Patient</span>
          </div>
          <button
            type="button"
            className="patient-sidebar-toggle"
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav
          className="patient-sidebar-navigation"
          aria-label="Patient navigation"
        >
          <button
            type="button"
            title="Overview"
            aria-label="Overview"
            className={`patient-nav-item ${isActivePath('/patient/dashboard') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/dashboard')}
          >
            <span className="patient-nav-icon" aria-hidden="true">OV</span>
            <span className="patient-nav-label">Overview</span>
          </button>

          <button
            type="button"
            title="My profile"
            aria-label="My profile"
            className={`patient-nav-item ${isActivePath('/patient/profile') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/profile')}
          >
            <span className="patient-nav-icon" aria-hidden="true">PR</span>
            <span className="patient-nav-label">My profile</span>
          </button>

          <button
            type="button"
            title="Appointments"
            aria-label="Appointments"
            className={`patient-nav-item ${isActivePath('/patient/appointments') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/appointments')}
          >
            <span className="patient-nav-icon" aria-hidden="true">AP</span>
            <span className="patient-nav-label">Appointments</span>
          </button>

          <button
            type="button"
            title="Care history"
            aria-label="Care history"
            className={`patient-nav-item ${isActivePath('/patient/encounters') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/encounters')}
          >
            <span className="patient-nav-icon" aria-hidden="true">CH</span>
            <span className="patient-nav-label">Care history</span>
          </button>

          <button
            type="button"
            title="Laboratory"
            aria-label="Laboratory"
            className={`patient-nav-item ${isActivePath('/patient/laboratory') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/laboratory')}
          >
            <span className="patient-nav-icon" aria-hidden="true">LB</span>
            <span className="patient-nav-label">Laboratory</span>
          </button>

          <button
            type="button"
            title="Prescriptions"
            aria-label="Prescriptions"
            className={`patient-nav-item ${isActivePath('/patient/prescriptions') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/prescriptions')}
          >
            <span className="patient-nav-icon" aria-hidden="true">RX</span>
            <span className="patient-nav-label">Prescriptions</span>
          </button>

          <button
            type="button"
            title="Documents"
            aria-label="Documents"
            className={`patient-nav-item ${isActivePath('/patient/documents') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/documents')}
          >
            <span className="patient-nav-icon" aria-hidden="true">DC</span>
            <span className="patient-nav-label">Documents</span>
          </button>

          <button
            type="button"
            title="Data access"
            aria-label="Data access"
            className={`patient-nav-item ${isActivePath('/patient/access') ? 'active' : ''}`}
            onClick={() => onNavigate('/patient/access')}
          >
            <span className="patient-nav-icon" aria-hidden="true">DA</span>
            <span className="patient-nav-label">Data access</span>
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
            title="Sign out"
            aria-label="Sign out"
            onClick={onLogout}
          >
            <span className="patient-nav-icon" aria-hidden="true">↪</span>
            <span className="patient-nav-label">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="patient-app-main">
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
        <button
          type="button"
          className="patient-dashboard-button secondary"
          disabled={pushBusy}
          onClick={() => void (pushEnabled ? disableWebPush() : enableWebPush())}
        >
          {pushBusy
            ? 'Updating web push...'
            : pushEnabled
              ? 'Disable web push'
              : 'Enable web push'}
        </button>
        {pushError ? (
          <span role="alert" className="patient-dashboard-inline-error">
            {pushError}
          </span>
        ) : null}
      </div>

        <header className="patient-topbar">
          <div>
            <span className="patient-topbar-label">
              Your healthcare account
            </span>
            <strong>
              {isOverviewContent
                ? `Welcome, ${dashboard.patient.firstName}`
                : currentPath === '/patient/encounters'
                  ? 'Care history'
                  : currentPath === '/patient/appointments'
                    ? 'Appointments'
                    : currentPath === '/patient/laboratory'
                      ? 'Laboratory'
                      : currentPath === '/patient/prescriptions'
                        ? 'Prescriptions'
                        : currentPath === '/patient/documents'
                          ? 'Documents'
                          : currentPath === '/patient/access'
                            ? 'Data access'
                            : 'Your healthcare account'}
            </strong>
          </div>

          <div className="patient-topbar-actions">
            {(isOverviewContent || currentPath === '/patient/encounters') ? (
              <button
                type="button"
                className="patient-dashboard-button secondary"
                disabled={refreshing}
                onClick={() => void refreshOpenContent()}
              >
                {refreshing ? 'Refreshing...' : 'Refresh section'}
              </button>
            ) : null}
            <div className="patient-topbar-id">
              <span>Revaltrix Patient ID</span>
              <strong>{dashboard.patient.platformPatientId}</strong>
            </div>
          </div>
        </header>

        <main className="patient-app-content">
          {error ? (
            <div className="patient-dashboard-inline-error" role="alert">
              {error}
            </div>
          ) : null}

          {isOverviewContent ? (
          <>
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

          {currentJourney ? (
            <section className="patient-dashboard-section">
              <div className="patient-dashboard-section-header">
                <div>
                  <p className="patient-dashboard-eyebrow">LIVE CARE</p>
                  <h2>Where you are now</h2>
                </div>

                <span className="patient-dashboard-live-badge">
                  ● Live
                </span>
              </div>

              {(() => {
                const current = currentJourney.current;
                const queueEntry = current?.queueEntry;

                if (!current) {
                  return null;
                }

                const queueStatus = queueEntry?.status ?? current.status;

                const statusLabel =
                  queueStatus === 'CALLED'
                    ? 'You have been called'
                    : queueStatus === 'IN_SERVICE'
                      ? 'You are being served'
                      : queueStatus === 'WAITING'
                        ? 'Waiting in queue'
                        : queueStatus.replaceAll('_', ' ');

                return (
                  <>
                    <article className="patient-current-care-card">
                      <div className="patient-current-care-main">
                        <p className="patient-dashboard-eyebrow">
                          CURRENT DEPARTMENT
                        </p>

                        <h2>
                          {current.department?.name ??
                            current.queue?.name ??
                            current.name}
                        </h2>

                        {current.branch?.name ? (
                          <p className="patient-current-care-location">
                            {current.branch.name}
                            {current.location ? ` · ${current.location}` : ''}
                          </p>
                        ) : current.location ? (
                          <p className="patient-current-care-location">
                            {current.location}
                          </p>
                        ) : null}

                        <div className="patient-current-care-status">
                          <strong>{statusLabel}</strong>

                          {queueEntry?.position !== null &&
                          queueEntry?.position !== undefined &&
                          ['WAITING', 'CREATED'].includes(queueStatus) ? (
                            <span>
                              Position #{queueEntry.position}
                            </span>
                          ) : null}

                          {current.estimatedWaitMinutes !== null &&
                          current.estimatedWaitMinutes !== undefined ? (
                            <span>
                              {current.estimatedWaitMinutes === 0
                                ? 'Being served now'
                                : `~${current.estimatedWaitMinutes} min wait`}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="patient-current-care-actions">
                        {queueEntry ? (
                          <button
                            type="button"
                            className="patient-dashboard-button"
                            onClick={() => setShowQueueDetails(true)}
                          >
                            View queue
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="patient-dashboard-button secondary"
                          onClick={() => setShowJourneyDetails(true)}
                        >
                          What happens next?
                        </button>
                      </div>
                    </article>

                    {currentJourney.next ? (
                      <div className="patient-next-step-card">
                        <div>
                          <p className="patient-dashboard-eyebrow">
                            NEXT
                          </p>
                          <strong>
                            {currentJourney.next.department?.name ??
                              currentJourney.next.name}
                          </strong>

                          {currentJourney.next.instruction ? (
                            <p>{currentJourney.next.instruction}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {activeJourneys.length > 1 ? (
                      <details className="patient-other-care">
                        <summary>
                          Other active care
                          <span>{activeJourneys.length - 1}</span>
                        </summary>

                        <div className="patient-other-care-list">
                          {activeJourneys
                            .filter(
                              (item) =>
                                item.journey.id !== currentJourney.journey.id,
                            )
                            .map((item) => (
                              <div
                                className="patient-other-care-item"
                                key={item.journey.id}
                              >
                                <strong>
                                  {item.current?.department?.name ??
                                    item.current?.queue?.name ??
                                    item.current?.name}
                                </strong>

                                <span>
                                  {item.current?.queueEntry?.status?.replaceAll(
                                    '_',
                                    ' ',
                                  ) ?? item.current?.status}
                                </span>
                              </div>
                            ))}
                        </div>
                      </details>
                    ) : null}
                  </>
                );
              })()}
            </section>
          ) : null}

          {showQueueDetails && currentJourney?.current?.queueEntry ? (
            <div
              className="patient-dashboard-modal-backdrop"
              role="presentation"
              onClick={() => setShowQueueDetails(false)}
            >
              <section
                className="patient-dashboard-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="queue-details-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="patient-dashboard-modal-header">
                  <div>
                    <p className="patient-dashboard-eyebrow">
                      LIVE QUEUE
                    </p>
                    <h2 id="queue-details-title">
                      {currentJourney.current.department?.name ??
                        currentJourney.current.queue?.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="patient-dashboard-modal-close"
                    onClick={() => setShowQueueDetails(false)}
                    aria-label="Close queue details"
                  >
                    ×
                  </button>
                </div>

                <div className="patient-dashboard-modal-grid">
                  <div>
                    <span>Queue number</span>
                    <strong>
                      {currentJourney.current.queueEntry.queueNumber}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {currentJourney.current.queueEntry.status.replaceAll(
                        '_',
                        ' ',
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Position</span>
                    <strong>
                      {currentJourney.current.queueEntry.position ??
                        'Calculating'}
                    </strong>
                  </div>

                  <div>
                    <span>Estimated wait</span>
                    <strong>
                      {currentJourney.current.estimatedWaitMinutes !== null &&
                      currentJourney.current.estimatedWaitMinutes !== undefined
                        ? currentJourney.current.estimatedWaitMinutes === 0
                          ? 'Now'
                          : `~${currentJourney.current.estimatedWaitMinutes} min`
                        : 'Calculating'}
                    </strong>
                  </div>
                </div>

                {currentJourney.current.instruction ? (
                  <div className="patient-dashboard-modal-instruction">
                    <strong>What to do</strong>
                    <p>{currentJourney.current.instruction}</p>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="patient-dashboard-button"
                  onClick={() => setShowQueueDetails(false)}
                >
                  Done
                </button>
              </section>
            </div>
          ) : null}

          {showJourneyDetails && currentJourney ? (
            <div
              className="patient-dashboard-modal-backdrop"
              role="presentation"
              onClick={() => setShowJourneyDetails(false)}
            >
              <section
                className="patient-dashboard-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="journey-details-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="patient-dashboard-modal-header">
                  <div>
                    <p className="patient-dashboard-eyebrow">
                      YOUR CARE PATH
                    </p>
                    <h2 id="journey-details-title">
                      What happens next?
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="patient-dashboard-modal-close"
                    onClick={() => setShowJourneyDetails(false)}
                    aria-label="Close care journey"
                  >
                    ×
                  </button>
                </div>

                <div className="patient-journey-timeline">
                  {currentJourney.steps.map((step) => (
                    <div
                      className={`patient-journey-timeline-item ${
                        step.id === currentJourney.current?.id
                          ? 'current'
                          : ''
                      }`}
                      key={step.id}
                    >
                      <div className="patient-journey-timeline-marker">
                        {step.status === 'COMPLETED' ? '✓' : '•'}
                      </div>

                      <div>
                        <strong>
                          {step.department?.name ?? step.name}
                        </strong>

                        <span>
                          {step.status.replaceAll('_', ' ')}
                        </span>

                        {step.location ? (
                          <p>Go to: {step.location}</p>
                        ) : null}

                        {step.instruction ? (
                          <p>{step.instruction}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="patient-dashboard-button"
                  onClick={() => setShowJourneyDetails(false)}
                >
                  Close
                </button>
              </section>
            </div>
          ) : null}

          {careHistory?.data.length ? (
            <details className="patient-care-history-dropdown">
              <summary>
                <span>
                  <strong>Care history</strong>
                  <small>Your completed care and clinical information</small>
                </span>
                <span>{careHistory.data.length}</span>
              </summary>

              <div className="patient-care-history-list">
                {careHistory.data.map((visit, visitIndex) => (
                  <details
                    key={`${visit.facility.code}-${visit.date}-${visitIndex}`}
                    className="patient-care-history-record"
                  >
                    <summary className="patient-care-history-summary">
                      <div className="patient-care-history-summary-main">
                        <div className="patient-care-history-summary-title">
                          <strong>{visit.facility.name}</strong>
                          <small>
                            {new Date(visit.date).toLocaleString()}
                          </small>
                        </div>

                        <span
                          className={`patient-care-history-status ${
                            visit.status === 'COMPLETED'
                              ? 'patient-care-history-status-completed'
                              : visit.status === 'ACTIVE'
                                ? 'patient-care-history-status-active'
                                : 'patient-care-history-status-other'
                          }`}
                        >
                          {visit.status === 'COMPLETED'
                            ? 'Completed'
                            : visit.status === 'ACTIVE'
                              ? 'In progress'
                              : visit.status.replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="patient-care-history-summary-stats">
                        <span>
                          <strong>{visit.departments.length}</strong>
                          <small>Departments</small>
                        </span>

                        <span>
                          <strong>{visit.clinicalNotes.length}</strong>
                          <small>Clinical notes</small>
                        </span>

                        <span>
                          <strong>
                            {visit.departments.reduce(
                              (total, department) =>
                                total + department.care.length,
                              0,
                            )}
                          </strong>
                          <small>Care records</small>
                        </span>

                        <span>
                          <strong>{visit.referrals.length}</strong>
                          <small>Referrals</small>
                        </span>
                      </div>
                    </summary>

                    <div className="patient-care-history-details">
                      <div className="patient-history-overview">
                        <div>
                          <span>Facility</span>
                          <strong>{visit.facility.name}</strong>
                        </div>

                        <div>
                          <span>Date</span>
                          <strong>
                            {new Date(visit.date).toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      {visit.clinicalNotes.length > 0 ? (
                        <section className="patient-history-clinical-section">
                          <h4>Clinical information</h4>

                          {visit.clinicalNotes.map((note, noteIndex) => (
                            <article
                              key={`${note.type}-${note.createdAt}-${noteIndex}`}
                              className="patient-history-clinical-note"
                            >
                              {note.chiefComplaint ? (
                                <div>
                                  <span>Reason for visit</span>
                                  <p>{note.chiefComplaint}</p>
                                </div>
                              ) : null}

                              {note.subjective ? (
                                <div>
                                  <span>What you reported</span>
                                  <p>{note.subjective}</p>
                                </div>
                              ) : null}

                              {note.objective ? (
                                <div>
                                  <span>Clinical findings</span>
                                  <p>{note.objective}</p>
                                </div>
                              ) : null}

                              {note.assessment ? (
                                <div>
                                  <span>Assessment</span>
                                  <p>{note.assessment}</p>
                                </div>
                              ) : null}

                              {note.plan ? (
                                <div>
                                  <span>Plan and advice</span>
                                  <p>{note.plan}</p>
                                </div>
                              ) : null}
                            </article>
                          ))}
                        </section>
                      ) : null}

                      {visit.departments.length > 0 ? (
                        <section className="patient-history-departments">
                          <h4>Care received</h4>

                          {visit.departments.map((department, departmentIndex) => (
                            <details
                              key={`${department.sequence}-${department.name}-${departmentIndex}`}
                              className="patient-history-step"
                            >
                              <summary className="patient-history-step-header">
                                <div>
                                  <strong>
                                    {department.department?.name ??
                                      department.name}
                                  </strong>
                                  <span>
                                    {department.branch?.name
                                      ? `${department.branch.name}${
                                          department.location
                                            ? ` · ${department.location}`
                                            : ''
                                        }`
                                      : department.location ?? ''}
                                  </span>
                                </div>

                                <b>
                                  {department.status === 'COMPLETED'
                                    ? 'Completed'
                                    : department.status.replaceAll('_', ' ')}
                                </b>
                              </summary>

                              <div className="patient-history-step-content">
                                {department.description ? (
                                  <div>
                                    <span>Service</span>
                                    <p>{department.description}</p>
                                  </div>
                                ) : null}

                                {department.instruction ? (
                                  <div>
                                    <span>Instructions</span>
                                    <p>{department.instruction}</p>
                                  </div>
                                ) : null}

                                {department.care.length > 0 ? (
                                  <div className="patient-history-care-records">
                                    <h5>What was done</h5>

                                    {department.care.map((record, recordIndex) => (
                                      <article
                                        key={`${record.recordedAt}-${recordIndex}`}
                                        className="patient-history-care-record"
                                      >
                                        {record.note ? (
                                          <div>
                                            <span>Care notes</span>
                                            <p>{record.note}</p>
                                          </div>
                                        ) : null}

                                        {record.procedures ? (
                                          <div>
                                            <span>Services / procedures</span>
                                            <p>{record.procedures}</p>
                                          </div>
                                        ) : null}

                                        {record.attachments.length > 0 ? (
                                          <div>
                                            <span>Documents</span>
                                            <div className="patient-history-attachments">
                                              {record.attachments.map((attachment) => (
                                                <span
                                                  key={attachment.id}
                                                  className="patient-history-attachment"
                                                >
                                                  {attachment.fileName}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
                                      </article>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="patient-history-empty">
                                    No additional care notes were recorded for
                                    this department.
                                  </p>
                                )}

                                {department.referrals.length > 0 ? (
                                  <div className="patient-history-referrals">
                                    <h5>Referral / next care</h5>

                                    {department.referrals.map(
                                      (referral, referralIndex) => (
                                        <article
                                          key={`${referral.createdAt}-${referralIndex}`}
                                        >
                                          <strong>
                                            {referral.fromDepartment ??
                                              'This department'}
                                            {referral.toDepartment
                                              ? ` → ${referral.toDepartment}`
                                              : ''}
                                          </strong>

                                          {referral.reason ? (
                                            <p>
                                              <span>Reason:</span>{' '}
                                              {referral.reason}
                                            </p>
                                          ) : null}

                                          {referral.instruction ? (
                                            <p>
                                              <span>Instructions:</span>{' '}
                                              {referral.instruction}
                                            </p>
                                          ) : null}
                                        </article>
                                      ),
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </details>
                          ))}
                        </section>
                      ) : null}

                      {visit.referrals.length > 0 ? (
                        <section className="patient-history-referrals">
                          <h4>Care referrals</h4>

                          {visit.referrals.map((referral, referralIndex) => (
                            <article
                              key={`${referral.createdAt}-${referralIndex}`}
                            >
                              <strong>
                                {referral.fromDepartment ??
                                  'Care department'}
                                {referral.toDepartment
                                  ? ` → ${referral.toDepartment}`
                                  : ''}
                              </strong>

                              {referral.reason ? (
                                <p>
                                  <span>Reason:</span> {referral.reason}
                                </p>
                              ) : null}

                              {referral.instruction ? (
                                <p>
                                  <span>Instructions:</span>{' '}
                                  {referral.instruction}
                                </p>
                              ) : null}
                            </article>
                          ))}
                        </section>
                      ) : null}
                    </div>
                  </details>
                ))}
              </div>
            </details>
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
          </>
          ) : currentPath === '/patient/encounters' ? (
            <section className="patient-dashboard-section patient-patient-content-panel">
              <div className="patient-dashboard-section-header">
                <div>
                  <p className="patient-dashboard-eyebrow">YOUR RECORDS</p>
                  <h1>Care history</h1>
                </div>
              </div>
              {careHistory?.data.length ? (
                <div className="patient-care-history-list">
                  {careHistory.data.map((visit, visitIndex) => (
                    <article
                      className="patient-care-history-record patient-care-history-summary"
                      key={`${visit.facility.code}-${visit.date}-${visitIndex}`}
                    >
                      <div className="patient-care-history-summary-main">
                        <div className="patient-care-history-summary-title">
                          <strong>{visit.facility.name}</strong>
                          <small>{new Date(visit.date).toLocaleString()}</small>
                        </div>
                        <span className="patient-care-history-status">
                          {visit.status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      {visit.departments.length ? (
                        <ul>
                          {visit.departments.map((department, departmentIndex) => (
                            <li key={`${department.name}-${departmentIndex}`}>
                              <strong>{department.name}</strong>
                              {department.care.length ? (
                                <span>
                                  {' '}· {department.care.length} care record
                                  {department.care.length === 1 ? '' : 's'}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No department details are available for this visit.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="patient-dashboard-empty">
                  <h2>No care history yet</h2>
                  <p>Completed care visits will appear here.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="patient-dashboard-section patient-patient-content-panel">
              <p className="patient-dashboard-eyebrow">PATIENT ACCOUNT</p>
              <h1>
                {currentPath === '/patient/appointments'
                  ? 'Appointments'
                  : currentPath === '/patient/laboratory'
                    ? 'Laboratory'
                    : currentPath === '/patient/prescriptions'
                      ? 'Prescriptions'
                      : currentPath === '/patient/documents'
                        ? 'Documents'
                        : currentPath === '/patient/access'
                          ? 'Data access'
                          : 'Patient section'}
              </h1>
              <div className="patient-dashboard-empty">
                <h2>This section is not available yet</h2>
                <p>
                  This area will display your information here when the
                  corresponding patient service is available. Your other
                  dashboard sections remain accessible from the menu.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
