'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  item_name: string;
  menu_date: string;
  is_read: boolean;
  created_at: string;
}

export default function UserNotifications() {
  const { userCode } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userCode) return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?code=${encodeURIComponent(userCode)}`);
        const data = await res.json();
        if (data.notifications?.length > 0) {
          setNotifications(data.notifications);
          setVisible(true);
        }
      } catch { /* ignore */ }
    };

    fetchNotifs();
    // Poll every 60s
    const timer = setInterval(fetchNotifs, 60000);
    return () => clearInterval(timer);
  }, [userCode]);

  const dismiss = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch { /* ignore */ }
    if (notifications.length <= 1) setVisible(false);
  };

  if (!visible || notifications.length === 0) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setVisible(false)}
      />

      {/* Notification Panel */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 space-y-3 animate-slide-down">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 animate-fade-in-up"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>

              {/* Close */}
              <button
                onClick={() => dismiss(notif.id)}
                className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <a
                href="/"
                className="flex-1 text-center py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-xl transition-colors"
              >
                Chọn món khác
              </a>
              <button
                onClick={() => dismiss(notif.id)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors"
              >
                Đã biết
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
