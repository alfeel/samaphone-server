import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, Loader2, AlertCircle, Send, Trash2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  createdAt: any;
}

export default function AdminNotifications() {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'general'
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
    }
  }, [isAdmin]);

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch {
        snap = await getDocs(collection(db, 'notifications'));
      }
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...formData,
        createdAt: serverTimestamp(),
        senderId: user?.uid
      });
      
      setNotifications([{
        id: docRef.id,
        ...formData,
        createdAt: { toDate: () => new Date() }
      } as any, ...notifications]);
      
      setFormData({ title: '', body: '', type: 'general' });
      alert('تم إرسال الإشعار بنجاح لجميع المستخدمين');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('فشل إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Bell className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">إدارة الإشعارات</h1>
          <p className="text-muted font-medium mt-1">إرسال وتتبع الإشعارات الجماعية للمستخدمين</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-6">إرسال إشعار جديد</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text mb-2">عنوان الإشعار</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
              placeholder="مثال: خصم 20% على جميع الإكسسوارات!"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text mb-2">نص الإشعار</label>
            <textarea
              required
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50 min-h-[100px]"
              placeholder="تفاصيل العرض أو التنبيه..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primaryDark transition-colors flex items-center gap-2"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              إرسال الآن
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-6">سجل الإشعارات المرسلة</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-muted font-medium">لا توجد إشعارات سابقة.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => {
              const date = notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('ar-SA') : 'غير محدد';
              return (
                <div key={notif.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between group">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                      <Bell size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text">{notif.title}</h3>
                      <p className="text-muted text-sm mt-1">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-2">{date}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(notif.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
