import type { PatientNotification } from '../api/notifications.api.js';

interface QueueCallAlertProps {
  notification: PatientNotification;
  onAcknowledge: () => void;
}

export function QueueCallAlert({
  notification,
  onAcknowledge,
}: QueueCallAlertProps) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="patient-queue-call-alert"
    >
      <div>
        <p className="patient-dashboard-eyebrow">QUEUE ALERT</p>
        <h2>{notification.title}</h2>
        <p>{notification.body}</p>
      </div>

      <button
        type="button"
        className="patient-dashboard-button"
        onClick={onAcknowledge}
      >
        I am coming
      </button>
    </section>
  );
}
