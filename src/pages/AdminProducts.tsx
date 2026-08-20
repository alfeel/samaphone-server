import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Loader2, Plus, AlertCircle, CheckCircle2, Edit2, Package } from 'lucide-react';

interface ProductData {
  id: string;
  nameAr: string;
  price: number;
  specialPrice?: number;
  imageUri: string;
  categoryId: string;
  inStock: boolean;
  status: string;
}

export default function AdminProducts() {
  const { user, userData } = useAuth();
  
  const [formData, setFormData] = useState({
    nameAr: '',
    price: '',
    specialPrice: '',
    imageUri: '',
    categoryId: 'all',
    inStock: true
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canAccess = user && (userData?.role === 'admin' || userData?.role === 'supplier');

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'));
      const querySnapshot = await getDocs(q);
      const prods = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductData));
      setProducts(prods);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchProducts();
    }
  }, [canAccess]);

  // Protect route
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">غير مصرح لك بالدخول</h2>
        <p className="text-gray-500 mt-2">هذه الصفحة مخصصة لمديري النظام والموردين فقط.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const finalStatus = (userData?.role === 'admin' || userData?.canPublishWithoutApproval) ? 'approved' : 'pending';
      const productData = {
        nameAr: formData.nameAr,
        price: Number(formData.price),
        specialPrice: formData.specialPrice ? Number(formData.specialPrice) : null,
        imageUri: formData.imageUri,
        categoryId: formData.categoryId,
        inStock: formData.inStock,
        status: finalStatus
      };

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'products', editingId), productData);
        setSuccess('تم تعديل المنتج بنجاح');
      } else {
        // Add new
        await addDoc(collection(db, 'products'), productData);
        setSuccess('تم إضافة المنتج بنجاح');
      }
      
      setFormData({
        nameAr: '',
        price: '',
        specialPrice: '',
        imageUri: '',
        categoryId: 'all',
        inStock: true
      });
      setEditingId(null);
      await fetchProducts(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: ProductData) => {
    setEditingId(product.id);
    setFormData({
      nameAr: product.nameAr || '',
      price: product.price?.toString() || '',
      specialPrice: product.specialPrice?.toString() || '',
      imageUri: product.imageUri || '',
      categoryId: product.categoryId || 'all',
      inStock: product.inStock ?? true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      nameAr: '',
      price: '',
      specialPrice: '',
      imageUri: '',
      categoryId: 'all',
      inStock: true
    });
    setError('');
    setSuccess('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl text-primary">
          <ShoppingBag size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">إدارة المنتجات</h1>
          <p className="text-gray-500 font-medium mt-1">إضافة وتعديل بيانات المنتجات والأسعار الخاصة</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          {editingId ? <Edit2 className="text-primary" /> : <Plus className="text-primary" />} 
          {editingId ? 'تعديل منتج' : 'إضافة منتج جديد'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 flex items-start gap-3">
            <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
            <p className="font-semibold text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنتج بالعربي</label>
              <input
                type="text"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="مثال: ايفون 15 برو ماكس"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">تصنيف المنتج</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="all">الكل</option>
                <option value="phones">جوالات</option>
                <option value="accessories">اكسسوارات</option>
                <option value="maintenance">صيانة</option>
                <option value="our_works">أعمالنا (لمراكز الخدمات)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">السعر العادي (ر.ي)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="مثال: 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">السعر الخاص (اختياري)</label>
              <input
                type="number"
                name="specialPrice"
                value={formData.specialPrice}
                onChange={handleChange}
                min="0"
                className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-red-300"
                placeholder="مثال: 45000"
              />
              <p className="text-xs text-red-500 mt-1">هذا السعر سيظهر فقط لكبار العملاء والموردين والوكلاء.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">رابط الصورة</label>
              <input
                type="text"
                name="imageUri"
                value={formData.imageUri}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                name="inStock"
                id="inStock"
                checked={formData.inStock}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="inStock" className="font-bold text-gray-700 select-none cursor-pointer">المنتج متوفر في المخزون</label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (editingId ? <Edit2 size={24} /> : <Plus size={24} />)}
              {loading ? 'جاري الحفظ...' : (editingId ? 'حفظ التعديلات' : 'إضافة المنتج')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-4 rounded-xl transition-all"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Package className="text-primary" /> المنتجات الحالية
        </h2>

        {fetching ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد منتجات مضافة بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className={`border rounded-2xl p-4 transition-all ${editingId === product.id ? 'border-primary shadow-md bg-primary/5' : 'border-gray-200 hover:shadow-md bg-white'}`}>
                <div className="h-32 bg-gray-50 rounded-xl flex items-center justify-center mb-4 overflow-hidden border border-gray-100">
                  {product.imageUri ? (
                    <img src={product.imageUri} alt={product.nameAr} className="max-h-full object-contain p-2" />
                  ) : (
                    <ShoppingBag className="text-gray-300" size={32} />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.nameAr}</h3>
                <div className="flex flex-col mb-4">
                  <span className="text-sm font-semibold text-gray-500">السعر: {product.price.toLocaleString()}</span>
                  {product.specialPrice && (
                    <span className="text-sm font-bold text-red-500">خاص: {product.specialPrice.toLocaleString()}</span>
                  )}
                </div>
                <button
                  onClick={() => handleEditClick(product)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-2 rounded-xl transition-all"
                >
                  <Edit2 size={16} /> تعديل
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
