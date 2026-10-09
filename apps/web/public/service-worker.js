self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const options = {
    body: payload.body,
    data: {
      ...(payload.data ?? {}),
      notificationType: payload.type,
    },
    tag: payload.id,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const notificationData = event.notification.data ?? {};
      const destinationQueueId = notificationData.destinationQueueId;

      if (
        notificationData.notificationType === 'PATIENT_DEPARTMENT_REFERRAL_RECEIVED' &&
        typeof destinationQueueId === 'string'
      ) {
        const targetPath = `/tenant/queue?queueId=${encodeURIComponent(destinationQueueId)}`;
        const targetUrl = new URL(targetPath, self.location.origin).href;
        const openClient = clients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );

        if (openClient) {
          return openClient.navigate(targetUrl).then((client) => client?.focus());
        }

        return self.clients.openWindow(targetPath);
      }

      const dashboard = clients.find((client) =>
        new URL(client.url).pathname.startsWith('/patient'),
      );

      if (dashboard) {
        return dashboard.focus();
      }

      return self.clients.openWindow('/patient/dashboard');
    }),
  );
});
