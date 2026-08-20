import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Users, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  rank?: number;
  canPublishWithoutApproval?: boolean;
}

export default function AdminUsers() {
  const { user, userData } = useAuth();
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserData));
      setUsersList(fetchedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('حدث خطأ أثناء جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: UserData) => {
    setSavingId(updatedUser.id);
    setError('');
    setSuccess('');
    try {
      const userRef = doc(db, 'users', updatedUser.id);
      await updateDoc(userRef, {
        role: updatedUser.role,
        rank: updatedUser.rank || null,
        canPublishWithoutApproval: updatedUser.canPublishWithoutApproval || false
      });
      setSuccess(`تم تحديث بيانات المستخدم ${updatedUser.email} بنجاح`);
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث المستخدم');
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleRankChange = (userId: string, newRank: string) => {
    const rankNum = newRank === 'none' ? undefined : Number(newRank);
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, rank: rankNum } : u));
  };

  const handleTogglePublish = (userId: string, checked: boolean) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, canPublishWithoutApproval: checked } : u));
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
        <p className="text-gray-500 mt-2">هذه الصفحة مخصصة للمدير العام فقط.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
          <Users size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-gray-500 font-medium mt-1">تحديد الأدوار، المراكز، وصلاحيات النشر</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
          <p className="font-semibold text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-right">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="pb-4 font-bold">البريد الإلكتروني</th>
                <th className="pb-4 font-bold w-48">الدور (Role)</th>
                <th className="pb-4 font-bold w-32">المركز (الرتبة)</th>
                <th className="pb-4 font-bold w-40 text-center">نشر بدون موافقة</th>
                <th className="pb-4 font-bold w-32 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 font-medium text-gray-800">{u.email}</td>
                  <td className="py-4 px-2">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="vip">أفضل عميل</option>
                      <option value="service_center">مركز خدمة</option>
                      <option value="supplier">مورد</option>
                      <option value="delivery_rep">مندوب توصيل</option>
                      <option value="marketing_rep">مندوب تسويق</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="admin">المدير العام</option>
                    </select>
                  </td>
                  <td className="py-4 px-2">
                    <select
                      value={u.rank ? u.rank.toString() : 'none'}
                      onChange={(e) => handleRankChange(u.id, e.target.value)}
                      className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="none">بدون مركز</option>
                      <option value="1">المركز الأول</option>
                      <option value="2">المركز الثاني</option>
                      <option value="3">المركز الثالث</option>
                    </select>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={u.canPublishWithoutApproval || false}
                        onChange={(e) => handleTogglePublish(u.id, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <button
                      onClick={() => handleUpdateUser(u)}
                      disabled={savingId === u.id}
                      className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {savingId === u.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      حفظ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
