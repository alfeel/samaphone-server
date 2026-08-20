import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Users, Package, ShoppingBag, Loader2, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Users Count
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      // 2. Fetch Products Count
      const productsSnap = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnap.size;

      // 3. Fetch Orders & Revenue
      const ordersSnap = await getDocs(collection(db, 'orders'));
      let totalRevenue = 0;
      let pendingOrders = 0;
      
      ordersSnap.forEach(doc => {
        const order = doc.data();
        if (order.status === 'delivered') totalRevenue += (order.total || 0);
        if (order.status === 'pending') pendingOrders++;
      });
      const totalOrders = ordersSnap.size;

      // 4. Fetch Recent Orders
      let fetchedRecentOrders: any[] = [];
      try {
        const qRecent = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(qRecent);
        fetchedRecentOrders = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e) {
        // Fallback if missing index
        const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        allOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        fetchedRecentOrders = allOrders.slice(0, 5);
      }

      setStats({ totalUsers, totalOrders, totalProducts, totalRevenue, pendingOrders });
      setRecentOrders(fetchedRecentOrders);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { title: 'إجمالي المبيعات', value: `${stats.totalRevenue.toLocaleString()} ر.ي`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'إجمالي الطلبات', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'الطلبات المعلقة', value: stats.pendingOrders.toLocaleString(), icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'العملاء', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'المنتجات', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <BarChart3 className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">الرئيسية والإحصائيات</h1>
          <p className="text-muted font-medium mt-1">نظرة عامة على أداء المتجر</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <h3 className="text-sm font-bold text-muted mb-1">{stat.title}</h3>
            <p className="text-2xl font-black text-text">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Links */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-text mb-4">روابط سريعة</h2>
          <Link to="/admin/orders" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
              <span className="font-bold text-text">إدارة الطلبات</span>
            </div>
          </Link>
          <Link to="/admin/products" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <Package className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
              <span className="font-bold text-text">إدارة المنتجات</span>
            </div>
          </Link>
          <Link to="/admin/users" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <Users className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
              <span className="font-bold text-text">العملاء والمستخدمين</span>
            </div>
          </Link>
          <Link to="/admin/finance" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <Wallet className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
              <span className="font-bold text-text">المالية والتسويات</span>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">أحدث الطلبات</h2>
            <Link to="/admin/orders" className="text-sm font-bold text-primary hover:underline">عرض الكل</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold text-text rounded-r-xl">رقم الطلب</th>
                  <th className="px-4 py-3 text-sm font-bold text-text">العميل</th>
                  <th className="px-4 py-3 text-sm font-bold text-text">الإجمالي</th>
                  <th className="px-4 py-3 text-sm font-bold text-text rounded-l-xl">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-muted">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-text">{order.userName || 'عميل'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-primary">{order.total?.toLocaleString()} ر.ي</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'delivered' ? 'مكتمل' : order.status === 'pending' ? 'قيد المراجعة' : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
