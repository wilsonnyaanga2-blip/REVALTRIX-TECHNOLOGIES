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

export async function getWebPushPublicKey(): Promise<string> {
  const response = await authenticatedApiRequest<{
    data: {
      publicKey: string;
    };
  }>('/v1/notifications/push/public-key');

  return response.data.publicKey;
}

export async function saveWebPushSubscription(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
): Promise<void> {
  await authenticatedApiRequest('/v1/notifications/push-subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

export async function deleteWebPushSubscription(
  endpoint: string,
  keys: {
    p256dh: string;
    auth: string;
  },
): Promise<void> {
  await authenticatedApiRequest('/v1/notifications/push-subscriptions', {
    method: 'DELETE',
    body: JSON.stringify({
      endpoint,
      ...keys,
    }),
  });
}
