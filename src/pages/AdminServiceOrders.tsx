import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Wrench, Loader2, AlertCircle, XCircle } from 'lucide-react';

interface ServiceOrder {
  id: string;
  userId: string;
  deviceType: string;
  description: string;
  status: string;
  price?: number;
  deliveryCode?: string;
  createdAt: any;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار استلام الجهاز',
  received: 'قيد الفحص',
  quoted: 'بانتظار موافقة العميل',
  approved: 'موافق - قيد الإصلاح',
  rejected: 'مرفوض - يُرجع الجهاز',
  done: 'مكتمل ✅',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  received: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  approved: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function AdminServiceOrders() {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Allow admin or 'center' (maintenance center) role
  const canAccess = user && (userData?.role === 'admin' || userData?.role === 'center');

  useEffect(() => {
    if (canAccess) {
      fetchOrders();
    }
  }, [canAccess]);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'service_orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceOrder));
      setOrders(fetched);
    } catch (err: any) {
      console.error('Error fetching service orders:', err);
      if (err.message.includes('index')) {
        const fallbackQ = query(collection(db, 'service_orders'));
        const snap = await getDocs(fallbackQ);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceOrder));
        fetched.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setOrders(fetched);
      } else {
        setError('تعذر جلب طلبات الصيانة');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (order: ServiceOrder, newStatus: string) => {
    let updateData: any = { status: newStatus };

    // إذا تم تحديد السعر من قبل المركز
    if (newStatus === 'quoted') {
      const priceStr = window.prompt('أدخل تكلفة الإصلاح المتوقعة (بالريال اليمني):', order.price?.toString() || '');
      if (priceStr === null) return; // User cancelled
      const price = Number(priceStr);
      if (isNaN(price) || price <= 0) {
        alert('سعر غير صالح');
        return;
      }
      updateData.price = price;
    }

    setUpdating(order.id);
    try {
      await updateDoc(doc(db, 'service_orders', order.id), updateData);
      setOrders(orders.map(o => o.id === order.id ? { ...o, ...updateData } : o));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('فشل تحديث حالة الطلب');
    } finally {
      setUpdating(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
        <p className="text-gray-500 mt-2">هذه الصفحة مخصصة للمديرين ومراكز الصيانة فقط.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Wrench className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">طلبات الصيانة (مشكلتي)</h1>
          <p className="text-muted font-medium mt-1">إدارة أجهزة العملاء وتحديد تكلفة الإصلاح</p>
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
          <Wrench size={56} className="mx-auto mb-4 text-muted opacity-40" />
          <h2 className="text-xl font-bold text-text mb-2">لا توجد طلبات صيانة</h2>
          <p className="text-muted font-medium">لم يقم أي عميل بتقديم طلب صيانة بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ar-SA') : 'غير محدد';
            return (
              <div key={order.id} className="bg-white border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${STATUS_COLORS[order.status]?.split(' ')[0] || 'bg-gray-200'}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-text">{order.deviceType}</h3>
                    <p className="text-xs text-muted font-medium mt-1">{date} • #{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {order.description}
                  </p>
                </div>

                {order.price !== undefined && (
                  <div className="mb-4 flex items-center justify-between bg-primary/5 p-3 rounded-xl">
                    <span className="text-sm font-bold text-primary">تكلفة الإصلاح:</span>
                    <span className="font-black text-primary">{order.price.toLocaleString()} ر.ي</span>
                  </div>
                )}
                
                {order.deliveryCode && (
                  <div className="mb-4 flex items-center justify-between bg-green-50 p-3 rounded-xl">
                    <span className="text-sm font-bold text-green-700">كود الاستلام:</span>
                    <span className="font-black text-green-700 text-lg tracking-widest">{order.deliveryCode}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-bold text-muted">تحديث الحالة:</span>
                  {updating === order.id ? (
                    <Loader2 size={20} className="animate-spin text-primary" />
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order, e.target.value)}
                      className="bg-white border border-border rounded-lg text-sm font-semibold text-text py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
