import { useState } from 'react';
import type { PatientNotification } from '../api/notifications.api.js';

interface NotificationInboxPanelProps {
  notifications: PatientNotification[];
  deletingNotificationId: string | null;
  error: string | null;
  onDelete: (notificationId: string) => void;
}

function getNotificationStatus(notification: PatientNotification): string {
  if (notification.type === 'QUEUE_PATIENT_CALLED') {
    return notification.readAt ? 'Read · Handled' : 'Unread · Action needed';
  }

  return notification.readAt ? 'Read' : 'Unread';
}

export function NotificationInboxPanel({
  notifications,
  deletingNotificationId,
  error,
  onDelete,
}: NotificationInboxPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') {
      return notification.readAt === null;
    }
    if (filter === 'read') {
      return notification.readAt !== null;
    }
    return true;
  });

  return (
    <section
      id="patient-notification-inbox"
      className="patient-notification-inbox"
      aria-label="Notifications"
    >
      <header className="patient-notification-inbox-header">
        <h2>Notifications</h2>
        <span>{notifications.length}</span>
      </header>

      <div className="patient-notification-filters" aria-label="Filter notifications">
        <button
          type="button"
          aria-pressed={filter === 'all'}
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          aria-pressed={filter === 'unread'}
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          aria-pressed={filter === 'read'}
          className={filter === 'read' ? 'active' : ''}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {error ? (
        <p className="patient-notification-inbox-error" role="alert">{error}</p>
      ) : null}

      {filteredNotifications.length === 0 ? (
        <p className="patient-notification-inbox-empty">
          {filter === 'all'
            ? 'You have no notifications.'
            : `You have no ${filter} notifications.`}
        </p>
      ) : (
        <ul className="patient-notification-inbox-list">
          {filteredNotifications.map((notification) => (
            <li key={notification.id} className="patient-notification-inbox-item">
              <div className="patient-notification-inbox-item-heading">
                <h3>{notification.title}</h3>
                <span
                  className={`patient-notification-status ${
                    notification.readAt
                      ? 'patient-notification-status-complete'
                      : 'patient-notification-status-pending'
                  }`}
                >
                  {getNotificationStatus(notification)}
                </span>
              </div>
              <p>{notification.body}</p>
              <time dateTime={notification.createdAt}>
                {new Date(notification.createdAt).toLocaleString()}
              </time>
              <button
                type="button"
                className="patient-notification-delete"
                aria-label={`Delete notification: ${notification.title}`}
                title="Delete notification"
                disabled={deletingNotificationId === notification.id}
                onClick={() => onDelete(notification.id)}
              >
                {deletingNotificationId === notification.id ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
