import { useCallback, useEffect, useState } from 'react';
import { getMyNotifications, markNotificationAsRead } from '../api/notifications.api.js';
import type { PatientNotification } from '../api/notifications.api.js';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setError(null);

    try {
      setNotifications(await getMyNotifications());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load notifications.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  async function markAsRead(notification: PatientNotification): Promise<void> {
    if (notification.readAt) {
      return;
    }

    setBusyId(notification.id);
    setError(null);

    try {
      const updated = await markNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to mark this notification as read.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function openDestinationQueue(notification: PatientNotification): Promise<void> {
    const queueId = notification.data?.destinationQueueId;

    if (typeof queueId !== 'string') {
      setError('This referral notification does not contain a destination queue.');
      return;
    }

    if (!notification.readAt) {
      setBusyId(notification.id);
      setError(null);

      try {
        await markNotificationAsRead(notification.id);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to mark this referral notification as read.',
        );
        setBusyId(null);
        return;
      }
    }

    onNavigate(`/tenant/queue?queueId=${encodeURIComponent(queueId)}`);
  }

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <p className="dashboard-eyebrow">ORGANIZATION WORKSPACE</p>
          <h1>Notifications</h1>
          <p>Updates and referrals addressed to your account.</p>
        </div>
        <button type="button" onClick={() => void loadNotifications()}>
          Refresh
        </button>
      </header>

      {error ? (
        <section className="patient-dashboard-error" role="alert">
          <p>{error}</p>
        </section>
      ) : null}

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <section>
          <p>You have no notifications.</p>
        </section>
      ) : (
        <section aria-label="Your notifications" style={{ display: 'grid', gap: '0.75rem' }}>
          {notifications.map((notification) => {
            const isReferral = notification.type === 'PATIENT_DEPARTMENT_REFERRAL_RECEIVED';
            const queueId = notification.data?.destinationQueueId;

            return (
              <article
                key={notification.id}
                style={{
                  border: '1px solid var(--border, #d1d5db)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  background: notification.readAt ? 'var(--card, #fff)' : 'var(--muted, #f3f4f6)',
                }}
              >
                <div
                  style={{
                    alignItems: 'start',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1rem', margin: 0 }}>{notification.title}</h2>
                    <p>{notification.body}</p>
                    <time dateTime={notification.createdAt}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </div>
                  {!notification.readAt ? <span>Unread</span> : null}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {isReferral && typeof queueId === 'string' ? (
                    <button
                      type="button"
                      disabled={busyId === notification.id}
                      onClick={() => void openDestinationQueue(notification)}
                    >
                      Open destination queue
                    </button>
                  ) : null}
                  {!notification.readAt ? (
                    <button
                      type="button"
                      disabled={busyId === notification.id}
                      onClick={() => void markAsRead(notification)}
                    >
                      Mark as read
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
