'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Send, Loader2, Sparkles, X } from 'lucide-react';
import {
  savePushSubscriptionAction,
  unsubscribeAction,
  sendTestPushNotificationAction,
} from '@/app/lib/notifications';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AdminNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  async function subscribeToPush() {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!isSupported) {
        throw new Error('Push notifications are not supported on this browser.');
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured in .env.');
      }

      // Request browser permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const rawSub = subscription.toJSON();
      if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
        throw new Error('Failed to generate full subscription keys.');
      }

      // Save to database
      const saveRes = await savePushSubscriptionAction(
        {
          endpoint: rawSub.endpoint,
          keys: {
            p256dh: rawSub.keys.p256dh,
            auth: rawSub.keys.auth,
          },
        },
        'admin',
        'admin@younus.com'
      );

      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Failed to register subscription with server.');
      }

      setIsSubscribed(true);
      setMessage({
        text: 'Push notifications successfully activated on this device!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      setMessage({
        text: err?.message || 'Failed to activate push notifications.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await unsubscribeAction(endpoint);
        }
      }
      setIsSubscribed(false);
      setMessage({
        text: 'Unsubscribed from notifications on this device.',
        type: 'info',
      });
    } catch (err: any) {
      console.error('Unsubscribe failed:', err);
      setMessage({
        text: err?.message || 'Failed to unsubscribe.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await sendTestPushNotificationAction();
      if (res.success) {
        setMessage({
          text: `Test alert dispatched! Sent to ${res.count || 1} device(s). Check your system notification panel.`,
          type: 'success',
        });
      } else {
        setMessage({
          text: res.error || 'Could not send test notification.',
          type: 'error',
        });
      }
    } catch (err: any) {
      console.error('Test notification failed:', err);
      setMessage({
        text: err?.message || 'Error triggering test notification.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 border shrink-0 ${
          isSubscribed
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-850'
        }`}
        title="Web Push Notifications"
      >
        <Bell className="w-4 h-4" />
        {isSubscribed && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 md:right-auto md:left-0 mt-3 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm sm:max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 z-50 text-left backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Browser Push Alerts</h4>
                <p className="text-[11px] text-zinc-400">Instant notifications for new orders</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Details */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Device Status:</span>
              <span className="flex items-center gap-1.5 font-medium">
                {isSubscribed ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed & Active
                  </span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1">
                    <BellOff className="w-3.5 h-3.5" /> Not Subscribed
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Browser Permission:</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  permission === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : permission === 'denied'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {permission}
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          {message && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : message.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
              }`}
            >
              {message.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {!isSubscribed ? (
              <button
                type="button"
                onClick={subscribeToPush}
                disabled={isLoading || !isSupported}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Enable Order Push Notifications
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={sendTestNotification}
                  disabled={isLoading}
                  className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  Send Test Notification
                </button>

                <button
                  type="button"
                  onClick={unsubscribeFromPush}
                  disabled={isLoading}
                  className="w-full py-1.5 px-3 text-zinc-500 hover:text-rose-400 text-[11px] transition text-center"
                >
                  Disable notifications on this browser
                </button>
              </div>
            )}
          </div>

          <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed text-center">
            When enabled, you will receive real-time notifications on your device whenever an order is submitted on Bellaro.
          </p>
        </div>
      )}
    </div>
  );
}
