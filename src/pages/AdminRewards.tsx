import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Gift, Loader2, AlertCircle, Save, Search } from 'lucide-react';

export default function AdminRewards() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    pointsPerRiyal: 0.1,
    pointsToRiyalRatio: 100 // 100 points = 1 Riyal
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch Config
      const confDoc = await getDoc(doc(db, 'settings', 'rewards'));
      if (confDoc.exists()) {
        setConfig(confDoc.data() as any);
      }

      // Fetch Users
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'rewards'), config);
      alert('تم حفظ إعدادات المكافآت بنجاح');
    } catch (err) {
      alert('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const updatePoints = async (userId: string, currentPoints: number) => {
    const newPoints = window.prompt('تعديل نقاط المستخدم:', currentPoints.toString());
    if (newPoints === null) return;
    const pts = Number(newPoints);
    if (isNaN(pts) || pts < 0) {
      alert('رقم غير صالح');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { points: pts });
      setUsers(users.map(u => u.id === userId ? { ...u, points: pts } : u));
    } catch (err) {
      alert('فشل تحديث النقاط');
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

  const filteredUsers = users.filter(u => 
    (u.displayName || '').includes(search) || 
    (u.email || '').includes(search) || 
    (u.phone || '').includes(search)
  ).sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Gift className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">المكافآت ونقاط الولاء</h1>
          <p className="text-muted font-medium mt-1">إعدادات النقاط وإدارة أرصدة العملاء</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Config Form */}
        <div className="md:col-span-1 bg-white border border-border rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-text mb-6">إعدادات النظام</h2>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text mb-2">النقاط لكل 1 ريال شراء</label>
              <input
                type="number"
                step="0.01"
                required
                value={config.pointsPerRiyal}
                onChange={e => setConfig({ ...config, pointsPerRiyal: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text mb-2">كم نقطة تساوي 1 ريال (للخصم)؟</label>
              <input
                type="number"
                required
                value={config.pointsToRiyalRatio}
                onChange={e => setConfig({ ...config, pointsToRiyalRatio: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white px-4 py-3 rounded-xl font-bold hover:bg-primaryDark transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              حفظ الإعدادات
            </button>
          </form>
        </div>

        {/* Users Points List */}
        <div className="md:col-span-2 bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-text">أرصدة العملاء</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن عميل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-64 bg-gray-50 border border-border rounded-xl py-2 px-10 text-sm focus:ring-2 focus:ring-primary/50"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-sm font-bold text-text rounded-r-xl">العميل</th>
                    <th className="px-4 py-3 text-sm font-bold text-text text-center">النقاط</th>
                    <th className="px-4 py-3 text-sm font-bold text-text rounded-l-xl text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.slice(0, 50).map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-text">{u.displayName || 'بدون اسم'}</div>
                        <div className="text-xs text-muted mt-1">{u.email || u.phone}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 font-black px-3 py-1 rounded-full border border-yellow-200">
                          {u.points || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <button
                          onClick={() => updatePoints(u.id, u.points || 0)}
                          className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg transition-colors"
                        >
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length > 50 && (
                <p className="text-center text-sm text-muted mt-4">يتم عرض أول 50 عميل. استخدم البحث لإيجاد المزيد.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
