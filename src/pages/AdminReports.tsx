import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileBarChart, Loader2, AlertCircle, Calendar, Download, TrendingUp } from 'lucide-react';

export default function AdminReports() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err: any) {
        // Fallback
        const qFallback = query(collection(db, 'orders'));
        snap = await getDocs(qFallback);
      }
      
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      allOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(allOrders);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = () => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const cutoff = new Date();
    
    if (dateFilter === 'today') {
      cutoff.setHours(0,0,0,0);
    } else if (dateFilter === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (dateFilter === 'month') {
      cutoff.setDate(now.getDate() - 30);
    }
    
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = (o.createdAt as Timestamp).toDate?.() || new Date(o.createdAt);
      return oDate >= cutoff;
    });
  };

  const generateReport = () => {
    const data = filteredOrders();
    const totalRevenue = data.reduce((sum, o) => sum + (o.status === 'delivered' ? (o.total || 0) : 0), 0);
    const totalOrders = data.length;
    const completedOrders = data.filter(o => o.status === 'delivered').length;
    
    // Top Products
    const productCount: Record<string, number> = {};
    data.forEach(o => {
      (o.items || []).forEach((item: any) => {
        if (!productCount[item.nameAr]) productCount[item.nameAr] = 0;
        productCount[item.nameAr] += (item.quantity || 1);
      });
    });
    
    const topProducts = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalRevenue, totalOrders, completedOrders, topProducts };
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-primary" /></div>;

  const reportData = generateReport();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <FileBarChart className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text">التقارير التحليلية</h1>
            <p className="text-muted font-medium mt-1">تقارير المبيعات وأداء المنتجات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-white border border-border rounded-xl text-sm font-bold text-text py-2.5 px-4 focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">كل الأوقات</option>
            <option value="today">اليوم</option>
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
          </select>
          <button
            onClick={() => window.print()}
            className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 print:hidden"
          >
            <Download size={18} /> طباعة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h3 className="font-bold text-muted">إجمالي المبيعات المؤكدة</h3>
          </div>
          <p className="text-3xl font-black text-text">{reportData.totalRevenue.toLocaleString()} ر.ي</p>
        </div>
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-blue-500" />
            <h3 className="font-bold text-muted">إجمالي الطلبات</h3>
          </div>
          <p className="text-3xl font-black text-text">{reportData.totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileBarChart size={20} className="text-emerald-500" />
            <h3 className="font-bold text-muted">الطلبات المكتملة</h3>
          </div>
          <p className="text-3xl font-black text-text">{reportData.completedOrders.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-6">المنتجات الأكثر مبيعاً (خلال الفترة المحددة)</h2>
        {reportData.topProducts.length === 0 ? (
          <p className="text-muted font-medium text-center py-8">لا توجد مبيعات في هذه الفترة</p>
        ) : (
          <div className="space-y-4">
            {reportData.topProducts.map(([name, qty], index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="font-bold text-text">{name}</span>
                </div>
                <span className="bg-white border border-border px-4 py-1.5 rounded-lg text-sm font-bold text-muted shadow-sm">
                  {qty} عنصر
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
