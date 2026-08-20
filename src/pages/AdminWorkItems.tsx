import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Loader2, AlertCircle, Plus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';

interface WorkItem {
  id: string;
  titleAr: string;
  descriptionAr: string;
  type: 'maintenance' | 'programming' | 'other';
  imageUri: string;
  status: 'published' | 'hidden';
}

export default function AdminWorkItems() {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WorkItem>>({
    titleAr: '',
    descriptionAr: '',
    type: 'maintenance',
    imageUri: '',
    status: 'published'
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
    }
  }, [isAdmin]);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'workItems'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkItem)));
    } catch (err) {
      console.error('Error fetching work items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: WorkItem) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try {
      await deleteDoc(doc(db, 'workItems', id));
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
      alert('فشل الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'workItems', editingId), formData);
        setItems(items.map(i => i.id === editingId ? { ...i, ...formData } as WorkItem : i));
      } else {
        const docRef = await addDoc(collection(db, 'workItems'), formData);
        setItems([...items, { id: docRef.id, ...formData } as WorkItem]);
      }
      setShowForm(false);
      setFormData({ titleAr: '', descriptionAr: '', type: 'maintenance', imageUri: '', status: 'published' });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving:', err);
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Briefcase className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text">معرض الأعمال</h1>
            <p className="text-muted font-medium mt-1">إدارة النماذج المعروضة في صفحة الخدمات</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({ titleAr: '', descriptionAr: '', type: 'maintenance', imageUri: '', status: 'published' });
            setEditingId(null);
            setShowForm(true);
          }}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primaryDark transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          إضافة عمل جديد
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-text">
                {editingId ? 'تعديل عمل' : 'إضافة عمل جديد'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-text mb-2">عنوان العمل</label>
                <input
                  type="text"
                  required
                  value={formData.titleAr}
                  onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  placeholder="مثال: تغيير شاشة آيفون 13"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">الوصف</label>
                <textarea
                  required
                  value={formData.descriptionAr}
                  onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">النوع</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="maintenance">صيانة</option>
                    <option value="programming">برمجة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="published">منشور</option>
                    <option value="hidden">مخفي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">رابط الصورة</label>
                <input
                  type="url"
                  required
                  value={formData.imageUri}
                  onChange={e => setFormData({ ...formData, imageUri: e.target.value })}
                  className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
                  dir="ltr"
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
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primaryDark transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  حفظ العمل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border rounded-3xl">
          <Briefcase size={56} className="mx-auto mb-4 text-muted opacity-40" />
          <h2 className="text-xl font-bold text-text mb-2">لا توجد أعمال</h2>
          <p className="text-muted font-medium">أضف أعمال ومشاريع ليتم عرضها في صفحة الخدمات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
              <div className="h-48 bg-gray-100 relative">
                {item.imageUri && (
                  <img src={item.imageUri} alt={item.titleAr} className="w-full h-full object-cover" />
                )}
                {item.status === 'hidden' && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">مخفي</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-text mb-2 line-clamp-1">{item.titleAr}</h3>
                <p className="text-muted text-sm font-medium line-clamp-2 mb-4">{item.descriptionAr}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold">
                    {item.type === 'maintenance' ? 'صيانة' : item.type === 'programming' ? 'برمجة' : 'أخرى'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
