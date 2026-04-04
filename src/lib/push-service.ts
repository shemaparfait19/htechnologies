import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Helper to init web-push with keys (call this before sending)
const initWebPush = () => {
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
};

export async function sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
  try {
    initWebPush();

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icons/icon-192x192.png',
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (error: any) {
          console.error('Error sending push to sub:', sub.id, error);
          if (error.statusCode === 410 || error.statusCode === 404) {
             // Subscription is invalid/expired, delete it
             await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          failed++;
        }
      })
    );

    return { sent, failed };
  } catch (error) {
    console.error('Refused to send push notification:', error);
    return { sent: 0, failed: 0, error };
  }
}
