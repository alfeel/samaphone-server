import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Tag, Loader2, AlertCircle, Plus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';

interface Offer {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
}

export default function AdminOffers() {
  const { user, userData } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    active: true
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchOffers();
    }
  }, [isAdmin]);

  const fetchOffers = async () => {
    try {
      const snap = await getDocs(collection(db, 'offers'));
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer)));
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setFormData({
      code: offer.code,
      discountPercentage: offer.discountPercentage.toString(),
      active: offer.active
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      setOffers(offers.filter(o => o.id !== id));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discountPercentage),
        active: formData.active
      };

      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), dataToSave);
        setOffers(offers.map(o => o.id === editingId ? { ...o, ...dataToSave } : o));
      } else {
        const docRef = await addDoc(collection(db, 'offers'), dataToSave);
        setOffers([...offers, { id: docRef.id, ...dataToSave }]);
      }
      
      setShowForm(false);
      setFormData({ code: '', discountPercentage: '', active: true });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving offer:', err);
      alert('فشل الحفظ');
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Tag className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text">العروض والكوبونات</h1>
            <p className="text-muted font-medium mt-1">إدارة أكواد الخصم الترويجية</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({ code: '', discountPercentage: '', active: true });
            setEditingId(null);
            setShowForm(true);
          }}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primaryDark transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          إضافة كوبون جديد
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-text">{editingId ? 'تعديل كوبون' : 'إضافة كوبون جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-text mb-2">كود الخصم</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50 uppercase"
                  placeholder="مثال: SAMA20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text mb-2">نسبة الخصم (%)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  placeholder="20"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="active" className="font-bold text-text cursor-pointer">الكوبون مفعل ويعمل</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-muted hover:bg-gray-100 transition-colors">إلغاء</button>
                <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primaryDark transition-colors flex items-center gap-2">
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-primary" /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border rounded-3xl">
          <Tag size={56} className="mx-auto mb-4 text-muted opacity-40" />
          <h2 className="text-xl font-bold text-text mb-2">لا توجد كوبونات</h2>
          <p className="text-muted font-medium">أضف كوبونات خصم لزيادة مبيعاتك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <div key={offer.id} className="bg-white border border-border rounded-2xl p-6 relative shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 text-primary font-black text-xl px-4 py-2 rounded-xl border border-primary/20 tracking-widest">
                  {offer.code}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${offer.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {offer.active ? 'مفعل' : 'معطل'}
                </span>
              </div>
              <p className="text-3xl font-black text-text mb-6">{offer.discountPercentage}% <span className="text-sm text-muted font-medium">خصم</span></p>
              
              <div className="flex gap-2 border-t border-border pt-4">
                <button onClick={() => handleEdit(offer)} className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-bold text-sm">
                  <Edit2 size={16} /> تعديل
                </button>
                <button onClick={() => handleDelete(offer.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
