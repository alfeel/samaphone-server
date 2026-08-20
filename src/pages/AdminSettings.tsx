import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Settings, Loader2, AlertCircle, Save, Plus, Trash2 } from 'lucide-react';

export default function AdminSettings() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [general, setGeneral] = useState({
    whatsappNumber: '',
    deliveryFee: 0,
    warrantyText: '',
  });

  const isAdmin = user && userData?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const catDoc = await getDoc(doc(db, 'settings', 'categories'));
      if (catDoc.exists()) setCategories(catDoc.data().items || []);

      const banDoc = await getDoc(doc(db, 'settings', 'banners'));
      if (banDoc.exists()) setBanners(banDoc.data().items || []);

      const genDoc = await getDoc(doc(db, 'settings', 'general'));
      if (genDoc.exists()) setGeneral(genDoc.data() as any);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: 'categories' | 'banners' | 'general') => {
    setSaving(true);
    try {
      if (section === 'categories') {
        await setDoc(doc(db, 'settings', 'categories'), { items: categories });
      } else if (section === 'banners') {
        await setDoc(doc(db, 'settings', 'banners'), { items: banners });
      } else if (section === 'general') {
        await setDoc(doc(db, 'settings', 'general'), general);
      }
      alert('تم الحفظ بنجاح');
    } catch (err) {
      console.error('Error saving settings:', err);
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Settings className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text">الإعدادات العامة</h1>
          <p className="text-muted font-medium mt-1">إدارة الأقسام، اللافتات الإعلانية، والإعدادات</p>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">إعدادات عامة</h2>
          <button onClick={() => handleSave('general')} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primaryDark transition-colors flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-text mb-2">رقم الواتساب (بدون أصفار)</label>
            <input
              type="text"
              value={general.whatsappNumber || ''}
              onChange={(e) => setGeneral({ ...general, whatsappNumber: e.target.value })}
              className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
              placeholder="967783454544"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text mb-2">رسوم التوصيل الافتراضية</label>
            <input
              type="number"
              value={general.deliveryFee || 0}
              onChange={(e) => setGeneral({ ...general, deliveryFee: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-text mb-2">نص الضمان للخدمات</label>
            <textarea
              value={general.warrantyText || ''}
              onChange={(e) => setGeneral({ ...general, warrantyText: e.target.value })}
              className="w-full bg-gray-50 border border-border rounded-xl py-3 px-4 text-text focus:ring-2 focus:ring-primary/50 min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Categories Settings */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">أقسام المتجر</h2>
            <p className="text-sm text-muted">إدارة تصنيفات المنتجات</p>
          </div>
          <button onClick={() => handleSave('categories')} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primaryDark transition-colors flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ الأقسام
          </button>
        </div>
        <div className="space-y-3 mb-4">
          {categories.map((cat, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <input
                type="text"
                placeholder="ID (مثال: phones)"
                value={cat.id || ''}
                onChange={(e) => {
                  const newCats = [...categories];
                  newCats[index].id = e.target.value;
                  setCategories(newCats);
                }}
                className="flex-1 bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="الاسم (مثال: جوالات)"
                value={cat.nameAr || ''}
                onChange={(e) => {
                  const newCats = [...categories];
                  newCats[index].nameAr = e.target.value;
                  setCategories(newCats);
                }}
                className="flex-1 bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="إيموجي (مثال: 📱)"
                value={cat.emoji || ''}
                onChange={(e) => {
                  const newCats = [...categories];
                  newCats[index].emoji = e.target.value;
                  setCategories(newCats);
                }}
                className="w-20 bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50 text-center"
              />
              <button
                onClick={() => setCategories(categories.filter((_, i) => i !== index))}
                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCategories([...categories, { id: '', nameAr: '', emoji: '' }])}
          className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
        >
          <Plus size={16} /> إضافة قسم جديد
        </button>
      </div>

      {/* Banners Settings */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">اللافتات الإعلانية (Banners)</h2>
            <p className="text-sm text-muted">تظهر في الصفحة الرئيسية</p>
          </div>
          <button onClick={() => handleSave('banners')} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primaryDark transition-colors flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ اللافتات
          </button>
        </div>
        <div className="space-y-4 mb-4">
          {banners.map((banner, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
              <button
                onClick={() => setBanners(banners.filter((_, i) => i !== index))}
                className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={16} />
              </button>
              
              <div>
                <label className="text-xs font-bold text-text mb-1 block">العنوان</label>
                <input
                  type="text"
                  value={banner.title || ''}
                  onChange={(e) => {
                    const newBanners = [...banners];
                    newBanners[index].title = e.target.value;
                    setBanners(newBanners);
                  }}
                  className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">الوصف</label>
                <input
                  type="text"
                  value={banner.subtitle || ''}
                  onChange={(e) => {
                    const newBanners = [...banners];
                    newBanners[index].subtitle = e.target.value;
                    setBanners(newBanners);
                  }}
                  className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">رابط الصورة (اختياري)</label>
                <input
                  type="text"
                  value={banner.imageUri || ''}
                  onChange={(e) => {
                    const newBanners = [...banners];
                    newBanners[index].imageUri = e.target.value;
                    setBanners(newBanners);
                  }}
                  className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-text mb-1 block">لون الخلفية (Tailwind)</label>
                  <input
                    type="text"
                    value={banner.bg || ''}
                    placeholder="bg-blue-600"
                    onChange={(e) => {
                      const newBanners = [...banners];
                      newBanners[index].bg = e.target.value;
                      setBanners(newBanners);
                    }}
                    className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
                    dir="ltr"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-text mb-1 block">الوسم (Tag)</label>
                  <input
                    type="text"
                    value={banner.tag || ''}
                    placeholder="عرض خاص"
                    onChange={(e) => {
                      const newBanners = [...banners];
                      newBanners[index].tag = e.target.value;
                      setBanners(newBanners);
                    }}
                    className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setBanners([...banners, { title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-600 to-indigo-900', tag: '', imageUri: '' }])}
          className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
        >
          <Plus size={16} /> إضافة إعلان جديد
        </button>
      </div>

    </div>
  );
}
