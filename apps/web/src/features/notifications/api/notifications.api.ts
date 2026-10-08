import { authenticatedApiRequest } from '../../../lib/auth-api.js';

export interface PatientNotificationDelivery {
  id: string;
  channel: string;
  status: string;
  sentAt: string | null;
}

export interface PatientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  updatedAt?: string;
  deliveries: PatientNotificationDelivery[];
}

interface NotificationListResponse {
  data: PatientNotification[];
}

interface NotificationResponse {
  data: PatientNotification;
}

export async function getMyNotifications(
  unreadOnly = false,
): Promise<PatientNotification[]> {
  const query = unreadOnly ? '?unreadOnly=true' : '';

  const response =
    await authenticatedApiRequest<NotificationListResponse>(
      `/v1/notifications${query}`,
    );

  return response.data;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<PatientNotification> {
  const response =
    await authenticatedApiRequest<NotificationResponse>(
      `/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: 'PATCH',
      },
    );

  return response.data;
}

export async function acknowledgeMyQueueCall(
  entryId: string,
): Promise<void> {
  await authenticatedApiRequest(
    `/v1/queues/my/${encodeURIComponent(entryId)}/acknowledge`,
    {
      method: 'POST',
    },
  );
}
