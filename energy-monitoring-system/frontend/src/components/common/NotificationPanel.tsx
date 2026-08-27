import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'High Energy Usage',
    description: 'Energy consumption exceeded the expected range.',
    time: '10 min ago',
    isRead: false,
  },
  {
    id: '2',
    title: 'Sensor Connected',
    description: 'Living Room Sensor is now online.',
    time: '1 hour ago',
    isRead: false,
  },
  {
    id: '3',
    title: 'Weekly Report Ready',
    description: 'Your weekly energy report is available.',
    time: 'Yesterday',
    isRead: false,
  },
];

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('ecostep-notifications');
    return stored ? JSON.parse(stored) : MOCK_NOTIFICATIONS;
  });
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    localStorage.setItem('ecostep-notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-[#1A312C]/60 hover:bg-white/80 dark:hover:bg-[#1A312C]/80 transition-all duration-200 shadow-sm"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-[#1A312C] dark:text-[#89D7B7]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#428475] text-[0.625rem] font-bold text-white shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 md:w-96 rounded-xl bg-white/90 dark:bg-[#1A312C]/90 backdrop-blur-md border border-white/50 dark:border-[#89D7B7]/20 shadow-xl p-5 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1A312C]/10 dark:border-[#89D7B7]/10">
            <h3 className="text-base font-semibold text-[#1A312C] dark:text-[#89D7B7]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-[#428475] hover:text-[#1A312C] dark:hover:text-[#89D7B7] transition-colors flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-[rgb(var(--color-neutral-400))] opacity-50" strokeWidth={1.5} />
                <p className="text-sm text-[rgb(var(--color-neutral-600))]">No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                  className={`
                    p-3 rounded-lg transition-all cursor-pointer
                    ${notification.isRead 
                      ? 'bg-white/40 dark:bg-[#1A312C]/40 hover:bg-white/60 dark:hover:bg-[#1A312C]/60' 
                      : 'bg-[rgba(137,215,183,0.15)] border border-[rgba(137,215,183,0.3)] hover:bg-[rgba(137,215,183,0.2)]'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-[#89D7B7] flex-shrink-0" />
                    )}
                    <div className={`flex-1 ${notification.isRead ? 'ml-5' : ''}`}>
                      <h4 className="text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7] mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-[rgb(var(--color-neutral-600))] mb-2">
                        {notification.description}
                      </p>
                      <p className="text-xs text-[rgb(var(--color-neutral-500))]">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
