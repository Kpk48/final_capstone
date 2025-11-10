"use client";
import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Filter, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const url = filter === 'unread' ? '/api/notifications?unread=true' : '/api/notifications';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'application_status': 'border-blue-500/30 bg-blue-500/5',
      'new_applicant': 'border-green-500/30 bg-green-500/5',
      'new_message': 'border-purple-500/30 bg-purple-500/5',
      'new_internship': 'border-pink-500/30 bg-pink-500/5',
      'follow_company_post': 'border-indigo-500/30 bg-indigo-500/5',
      'follow_topic_match': 'border-yellow-500/30 bg-yellow-500/5',
    };
    return colors[type] || 'border-white/10 bg-white/5';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'application_status': 'Application Update',
      'new_applicant': 'New Applicant',
      'new_message': 'New Message',
      'new_internship': 'New Opportunity',
      'follow_company_post': 'Company Update',
      'follow_topic_match': 'Topic Match',
    };
    return labels[type] || type;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative min-h-screen text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="page-shell max-w-4xl">
        {/* Header */}
        <div className="page-hero">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="page-subtitle mt-2">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="section-card mb-6">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-zinc-400" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="section-card text-center py-12">
            <Bell className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-zinc-400">
              {filter === 'unread' 
                ? "You're all caught up!"
                : "You'll see notifications here when you receive them"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="cursor-pointer"
              >
                <Card
                  className={`section-card hover:border-purple-500/30 transition ${
                    !notification.read ? 'border-purple-500/30 bg-purple-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-lg border ${getNotificationColor(notification.type)} mb-2`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-zinc-300'}`}>
                          {notification.title}
                        </h3>
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-zinc-400" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-zinc-400 mb-3">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-zinc-500">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
