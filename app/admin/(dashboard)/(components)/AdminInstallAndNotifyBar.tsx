'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Loader2,
  X,
  Send,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import {
  savePushSubscriptionAction,
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

export default function AdminInstallAndNotifyBar() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotifyLoading, setIsNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);
    if (isAppleDevice) {
      setActiveTab('ios');
    }

    // 3. Automatically register service worker for PWA criteria & push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if ('PushManager' in window) {
            reg.pushManager.getSubscription().then((sub) => {
              setIsSubscribed(!!sub);
            });
          }
        })
        .catch((err) => {
          console.warn('Service worker registration error:', err);
        });
    }

    // 4. Capture Chrome/Android beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Capture app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleOpenModal = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt().catch(() => setShowInstallModal(true));
      } else {
        setShowInstallModal(true);
      }
    };
    window.addEventListener('open-admin-install-modal', handleOpenModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-admin-install-modal', handleOpenModal);
    };
  }, []);

  // Handle Enable Notifications
  const handleEnableNotifications = async () => {
    setIsNotifyLoading(true);
    setNotifyMessage(null);

    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('Push notifications are not supported in this browser.');
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID public key not configured.');
      }

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        throw new Error('Notification permission was denied. Please allow notifications in browser settings.');
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const raw = sub.toJSON();
      if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
        throw new Error('Could not read subscription keys.');
      }

      const res = await savePushSubscriptionAction(
        {
          endpoint: raw.endpoint,
          keys: {
            p256dh: raw.keys.p256dh,
            auth: raw.keys.auth,
          },
        },
        'admin',
        'admin@younus.com'
      );

      if (!res.success) {
        throw new Error(res.error || 'Server rejected subscription.');
      }

      setIsSubscribed(true);
      setNotifyMessage({
        text: 'Order notifications active! Your device will now receive instant alerts for new orders.',
        type: 'success',
      });
    } catch (err: any) {
      setNotifyMessage({
        text: err?.message || 'Failed to enable notifications.',
        type: 'error',
      });
    } finally {
      setIsNotifyLoading(false);
    }
  };

  // Handle Send Test Notification
  const handleSendTest = async () => {
    setIsNotifyLoading(true);
    setNotifyMessage(null);
    try {
      const res = await sendTestPushNotificationAction();
      if (res.success) {
        setNotifyMessage({
          text: `Test alert dispatched! Sent to ${res.count || 1} subscribed device(s).`,
          type: 'success',
        });
      } else {
        setNotifyMessage({
          text: res.error || 'Could not send test notification.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setNotifyMessage({
        text: err?.message || 'Error triggering test alert.',
        type: 'error',
      });
    } finally {
      setIsNotifyLoading(false);
    }
  };

  // Handle Install Admin App on Phone
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    setShowInstallModal(true);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/admin`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-sm text-white space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Info Side */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Mobile Admin & Live Order Alerts
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Quick Setup
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                Install Bellaro Admin directly onto your phone screen like a native app and enable instant browser push notifications for every incoming order.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            {/* Install On Phone Button */}
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-semibold w-full sm:w-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>App Installed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallApp}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl text-xs shadow-md transition cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                <Smartphone className="w-4 h-4 text-neutral-800" />
                <span>Install on Phone</span>
              </button>
            )}

            {/* Notification Button */}
            {!isSubscribed ? (
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isNotifyLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold rounded-xl text-xs shadow-md shadow-amber-500/10 transition cursor-pointer disabled:opacity-50 active:scale-95 w-full sm:w-auto"
              >
                {isNotifyLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                <span>Enable Order Notifications</span>
              </button>
            ) : (
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <span className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex-1 sm:flex-initial">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notifications Active</span>
                </span>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isNotifyLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-zinc-700 transition cursor-pointer disabled:opacity-50"
                  title="Send a test notification to verify delivery"
                >
                  {isNotifyLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Test Alert</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {notifyMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              notifyMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notifyMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{notifyMessage.text}</span>
            </div>
            <button
              onClick={() => setNotifyMessage(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">Install Bellaro Admin</h3>
                <p className="text-xs text-zinc-400">Add to your Phone Home Screen in seconds</p>
              </div>
            </div>

            {/* OS Selector Tabs */}
            <div className="flex rounded-xl bg-zinc-950/80 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'android'
                    ? 'bg-amber-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Android / Chrome
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'ios'
                    ? 'bg-amber-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                iPhone / Safari
              </button>
            </div>

            {/* Direct Prompt Banner if available */}
            {deferredPrompt && activeTab === 'android' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
                <div className="text-xs text-amber-300">
                  <span className="font-semibold text-white">Ready to install!</span> Your browser supports 1-click install.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      if (choice?.outcome === 'accepted') {
                        setIsInstalled(true);
                        setShowInstallModal(false);
                      }
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* Steps Guide */}
            {activeTab === 'android' ? (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Open this page in <span className="text-white font-semibold">Google Chrome</span>. If you opened this link from WhatsApp or Facebook, tap <span className="text-white font-semibold">⋮ &rarr; &quot;Open in Chrome&quot;</span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Tap Chrome&apos;s <span className="text-white font-semibold">three-dot menu (⋮)</span> in the top-right corner.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Tap <span className="text-white font-semibold">&quot;Install app&quot;</span> (or <span className="text-white font-semibold">&quot;Add to Home screen&quot;</span>) and tap <span className="text-emerald-400 font-semibold">Install</span>.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Open this page in <span className="text-white font-semibold">Safari</span> (Apple only supports home-screen web apps in Safari).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Tap the <span className="text-white font-semibold">Share button</span> (
                    <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" />
                    ) in Safari&apos;s bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs leading-relaxed text-zinc-300">
                    Scroll down and tap <span className="text-white font-semibold">&quot;Add to Home Screen&quot;</span> (
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />
                    ), then tap <span className="text-amber-400 font-semibold">&quot;Add&quot;</span> at the top right.
                  </div>
                </div>
              </div>
            )}

            {/* Quick URL Copy Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-zinc-700/60 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Admin Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Admin Link to open on mobile browser</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
