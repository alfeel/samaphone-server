import { useState, useEffect } from 'react';
import { collection, updateDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Package, Loader2, AlertCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  userId: string;
  userName?: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: any;
  items: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  processing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  delivered: 'مكتمل',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function AdminOrders() {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(fetchedOrders);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching orders:', err);
        setError('تعذر جلب الطلبات');
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('فشل تحديث حالة الطلب');
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
        <p className="text-gray-500 mt-2">هذه الصفحة مخصصة لمديري النظام فقط.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Package className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">إدارة الطلبات</h1>
          <p className="text-muted font-medium mt-1">تتبع وتحديث حالة طلبات العملاء</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold border border-red-100 flex items-center gap-2">
          <XCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border rounded-3xl">
          <Package size={56} className="mx-auto mb-4 text-muted opacity-40" />
          <h2 className="text-xl font-bold text-text mb-2">لا توجد طلبات</h2>
          <p className="text-muted font-medium">لم يتم إجراء أي طلبات في المتجر بعد.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-text">رقم الطلب</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">العميل</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">الإجمالي</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">طريقة الدفع</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">الحالة</th>
                  <th className="px-6 py-4 text-sm font-bold text-text text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => {
                  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ar-SA') : 'غير محدد';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-text">#{order.id.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-muted mt-1">{date}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {order.userName || 'عميل'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {order.total.toLocaleString()} ر.ي
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {order.paymentMethod === 'cod' ? 'عند الاستلام' : order.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {updating === order.id ? (
                          <Loader2 size={20} className="animate-spin text-primary inline-block" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="bg-white border border-border rounded-lg text-sm font-semibold text-text py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
