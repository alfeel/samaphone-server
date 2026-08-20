import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Wallet, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface Settlement {
  id: string;
  partyId: string;
  partyName: string;
  amount: number;
  type: 'pay_to_supplier' | 'receive_from_center';
  method: string;
  createdAt: any;
  note: string;
}

export default function AdminFinance() {
  const { user, userData } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    partyId: '',
    partyName: '',
    amount: '',
    type: 'pay_to_supplier',
    method: 'cash',
    note: ''
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchSettlements();
    }
  }, [isAdmin]);

  const fetchSettlements = async () => {
    try {
      const q = query(collection(db, 'settlements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setSettlements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Settlement)));
    } catch (err: any) {
      console.error('Error fetching settlements:', err);
      if (err.message.includes('index')) {
        const snap = await getDocs(collection(db, 'settlements'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Settlement));
        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setSettlements(docs);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'settlements'), {
        ...formData,
        amount: Number(formData.amount),
        createdAt: serverTimestamp(),
        adminId: user?.uid
      });
      
      // Update local state
      setSettlements([{
        id: docRef.id,
        ...formData,
        amount: Number(formData.amount),
        createdAt: { toDate: () => new Date() }
      } as any, ...settlements]);
      
      setShowForm(false);
      setFormData({ partyId: '', partyName: '', amount: '', type: 'pay_to_supplier', method: 'cash', note: '' });
      alert('تم تسجيل التسوية بنجاح');
    } catch (err) {
      console.error('Error saving settlement:', err);
      alert('فشل حفظ التسوية');
    } finally {
      setSaving(false);
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Wallet className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text">المالية والتسويات</h1>
            <p className="text-muted font-medium mt-1">تتبع الحسابات وتسجيل الدفعات مع الموردين والمراكز</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primaryDark transition-all"
        >
          تسجيل دفعة جديدة
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/90">إجمالي المدفوعات للموردين</h3>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={20} className="text-white" />
            </div>
          </div>
          <p className="text-3xl font-black">
            {settlements.filter(s => s.type === 'pay_to_supplier').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} ر.ي
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white/90">إجمالي المقبوضات (عمولات)</h3>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowDownRight size={20} className="text-white" />
            </div>
          </div>
          <p className="text-3xl font-black">
            {settlements.filter(s => s.type === 'receive_from_center').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} ر.ي
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-gray-50">
              <h2 className="text-xl font-bold text-text">تسجيل تسوية مالية</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">نوع التسوية</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="pay_to_supplier">دفع لمورد (سحب)</option>
                    <option value="receive_from_center">استلام من مركز/مندوب (إيداع)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">المبلغ (ريال)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">اسم الطرف (المورد/المركز)</label>
                  <input
                    type="text"
                    required
                    value={formData.partyName}
                    onChange={e => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">طريقة الدفع</label>
                  <select
                    value={formData.method}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="wallet">محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">ملاحظات البيان</label>
                <input
                  type="text"
                  required
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  placeholder="مثال: تسوية أرباح شهر مارس"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl font-bold text-muted hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primaryDark transition-colors flex items-center gap-2"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  حفظ العمليـة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlements List */}
      <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text">سجل العمليات المالية</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-12 text-muted font-medium">لا توجد عمليات مالية مسجلة بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-text">التاريخ</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">الطرف</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">النوع</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">المبلغ</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">الطريقة</th>
                  <th className="px-6 py-4 text-sm font-bold text-text">البيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settlements.map(settlement => {
                  const date = settlement.createdAt?.toDate ? settlement.createdAt.toDate().toLocaleDateString('ar-SA') : 'غير محدد';
                  return (
                    <tr key={settlement.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-muted">{date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-text">{settlement.partyName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-max items-center gap-1 ${
                          settlement.type === 'pay_to_supplier' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {settlement.type === 'pay_to_supplier' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {settlement.type === 'pay_to_supplier' ? 'دفع (صرف)' : 'استلام (قبض)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-text">{settlement.amount.toLocaleString()} ر.ي</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">
                        {settlement.method === 'cash' ? 'نقدي' : settlement.method === 'bank' ? 'بنكي' : 'محفظة'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{settlement.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
