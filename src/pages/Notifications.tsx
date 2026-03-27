import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Notification } from '../types';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  MailOpen, 
  Mail,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    try {
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "p-6 rounded-3xl border transition-all flex items-start gap-4 group",
                notification.read 
                  ? "bg-white border-slate-100 opacity-60" 
                  : "bg-white border-primary/20 shadow-md shadow-primary/5"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                notification.read ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
              )}>
                {notification.read ? <MailOpen size={24} /> : <Mail size={24} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn("text-base font-bold truncate", notification.read ? "text-slate-600" : "text-slate-900")}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium shrink-0">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className={cn("text-sm leading-relaxed", notification.read ? "text-slate-500" : "text-slate-700")}>
                  {notification.message}
                </p>
                
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Mark as read
                  </button>
                )}
              </div>

              <button
                onClick={() => deleteNotification(notification.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Bell size={40} className="opacity-20" />
              </div>
              <p className="text-lg font-medium">You're all caught up!</p>
              <p className="text-sm">No new notifications at the moment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
