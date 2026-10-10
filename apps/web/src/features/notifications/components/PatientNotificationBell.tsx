interface PatientNotificationBellProps {
  unreadCount: number;
  expanded: boolean;
  onClick: () => void;
}

export function PatientNotificationBell({
  unreadCount,
  expanded,
  onClick,
}: PatientNotificationBellProps) {
  return (
    <button
      type="button"
      className="patient-notification-bell"
      aria-controls="patient-notification-inbox"
      aria-expanded={expanded}
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : 'Notifications'
      }
      onClick={onClick}
    >
      <span aria-hidden="true">🔔</span>

      {unreadCount > 0 ? (
        <span className="patient-notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
