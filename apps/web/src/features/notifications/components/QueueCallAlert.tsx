import type { PatientNotification } from '../api/notifications.api.js';

interface QueueCallAlertProps {
  notification: PatientNotification;
  busy: boolean;
  error: string | null;
  onAcknowledge: () => void;
}

export function QueueCallAlert({
  notification,
  busy,
  error,
  onAcknowledge,
}: QueueCallAlertProps) {
  return (
    <div className="patient-queue-call-overlay">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="patient-queue-call-title"
        aria-describedby="patient-queue-call-description"
        className="patient-queue-call-alert"
      >
        <div className="patient-queue-call-icon" aria-hidden="true">!</div>
        <h2 id="patient-queue-call-title">{notification.title}</h2>
        <p id="patient-queue-call-description">{notification.body}</p>
        {error ? (
          <p className="patient-queue-call-error" role="alert">{error}</p>
        ) : null}
        <button
          type="button"
          className="patient-dashboard-button"
          disabled={busy}
          onClick={onAcknowledge}
        >
          {busy ? 'Sending response...' : 'I am coming'}
        </button>
      </section>
    </div>
  );
}
