'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, XCircle } from 'lucide-react';

export default function NotificationTestPage() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testMessage, setTestMessage] = useState('This is a test notification from H TECHNOLOGIES LTD!');
  const [browserSupport, setBrowserSupport] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ('Notification' in window) {
      setBrowserSupport(true);
      setPermission(Notification.permission);
    }
  }, []);

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      return true;
    }
    return false;
  };

  const requestPermission = async () => {
    if (!checkPermission()) {
      toast({
        title: 'Not supported',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive',
      });
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: 'Permission granted',
        description: 'You can now receive notifications',
      });
    } else {
      toast({
        title: 'Permission denied',
        description: 'Please enable notifications in browser settings',
        variant: 'destructive',
      });
    }
  };

  const subscribeToNotifications = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || 'BPrMSDOKq3t_C4EAp6c-NwQA_ZMoodPJ5lHnhyID7itr0Md0OP';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        setSubscribed(true);
        toast({
          title: 'Subscribed!',
          description: 'You are now subscribed to push notifications',
        });
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      // Send via API
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          title: testTitle,
          message: testMessage,
          icon: '/icons/icon-512x512.svg',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Notification sent!',
          description: 'Check your notifications',
        });
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error: any) {
      toast({
        title: 'Send failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBrowserNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification(testTitle, {
        body: testMessage,
        icon: '/icons/icon-512x512.svg',
        badge: '/icons/icon-512x512.svg',
      });
      toast({
        title: 'Browser notification sent!',
        description: 'Check your notifications',
      });
    } else {
      toast({
        title: 'Permission required',
        description: 'Please grant notification permission first',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Testing</h2>
        <p className="text-muted-foreground">
          Test push notifications and verify they work correctly
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Status</CardTitle>
          <CardDescription>Current notification permissions and subscription status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Browser Support</p>
              <p className="text-sm text-muted-foreground">
                {mounted ? (browserSupport ? 'Supported' : 'Not supported') : 'Checking...'}
              </p>
            </div>
            {browserSupport ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Permission Status</p>
              <p className="text-sm text-muted-foreground capitalize">{permission}</p>
            </div>
            {permission === 'granted' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : permission === 'denied' ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Bell className="h-6 w-6 text-gray-400" />
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Subscription Status</p>
              <p className="text-sm text-muted-foreground">
                {subscribed ? 'Subscribed' : 'Not subscribed'}
              </p>
            </div>
            {subscribed ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Notifications</CardTitle>
          <CardDescription>Follow these steps to enable notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Step 1: Request Permission</Label>
            <Button 
              onClick={requestPermission} 
              disabled={permission === 'granted'}
              className="w-full"
            >
              {permission === 'granted' ? 'Permission Granted ✓' : 'Request Permission'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Step 2: Subscribe to Push Notifications</Label>
            <Button 
              onClick={subscribeToNotifications}
              disabled={permission !== 'granted' || subscribed || loading}
              className="w-full"
            >
              {loading ? 'Subscribing...' : subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>Customize and send a test notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Notification Message</Label>
            <Textarea
              id="message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={sendBrowserNotification}
              disabled={permission !== 'granted'}
              variant="outline"
            >
              Browser Notification
            </Button>
            <Button
              onClick={sendTestNotification}
              disabled={!subscribed || loading}
            >
              {loading ? 'Sending...' : 'Push Notification'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ol className="space-y-2 list-decimal list-inside">
            <li>Click "Request Permission" and allow notifications</li>
            <li>Click "Subscribe" to subscribe to push notifications</li>
            <li>Customize the test message if desired</li>
            <li>Click "Browser Notification" for instant local notification</li>
            <li>Click "Push Notification" to test server-sent notifications</li>
            <li>Check that notifications appear on your device</li>
          </ol>
          <p className="mt-4 text-sm">
            <strong>Note:</strong> On mobile, install the PWA first for best results.
            Notifications work better in installed PWAs than in browsers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
