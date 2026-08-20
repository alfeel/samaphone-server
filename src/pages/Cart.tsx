import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, Phone, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ELIGIBLE_ROLES_FOR_SPECIAL_PRICE } from '../lib/constants';

const FALLBACK_WHATSAPP = '967783454544';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const isEligibleForSpecialPrice = userData?.role && ELIGIBLE_ROLES_FOR_SPECIAL_PRICE.includes(userData.role);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(FALLBACK_WHATSAPP);

  // جلب رقم واتساب من Firestore
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'contact'));
        if (snap.exists()) {
          const num = snap.data()?.whatsappNumber;
          if (num && String(num).trim()) {
            setWhatsappNumber(String(num).trim());
          }
        }
      } catch {
        // الإخفاق صامت — يُستخدم الرقم الاحتياطي
      }
    };
    fetchContact();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const orderData = {
        userId: user.uid,
        items,
        totalAmount: totalPrice,
        customerPhone: phone,
        deliveryAddress: address,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Trigger notification for admins
      try {
        await fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: docRef.id, event: 'new' })
        });
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr);
      }

      setSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إتمام الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const orderMessage = `مرحباً سماء فون، لقد قمت بطلب جديد!
    
تفاصيل الطلب:
${items.map(item => `- ${item.nameAr} (الكمية: ${item.quantity})`).join('\n')}

المجموع الإجمالي: ${totalPrice.toLocaleString()} ر.ي
العنوان: ${address}
رقم التواصل: ${phone}

الرجاء تأكيد الطلب.`;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-green-50 text-green-500 w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black text-text mb-2">تم تأكيد طلبك بنجاح! 🎉</h1>
        <p className="text-muted font-medium mb-6 max-w-md">
          شكراً لتسوقك من سماء فون. تم حفظ طلبك في النظام.
        </p>
        
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8 max-w-md w-full">
          <h3 className="font-bold text-green-800 mb-2">لضمان سرعة التوصيل 🚀</h3>
          <p className="text-sm text-green-700 mb-4">
            نوصي بإرسال نسخة من طلبك مباشرة عبر الواتساب لفريق المبيعات ليتم تجهيزه فوراً.
          </p>
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-500/30"
          >
            <Phone size={20} />
            إرسال الطلب عبر واتساب
          </a>
        </div>

        <Link to="/" className="text-primary font-bold hover:underline">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-gray-100 text-gray-400 w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">سلة المشتريات فارغة</h1>
        <p className="text-muted font-medium mb-8">لم تقم بإضافة أي منتجات للسلة بعد.</p>
        <Link to="/" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primaryDark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-text mb-8 flex items-center gap-3">
        <ShoppingBag className="text-primary" size={32} />
        سلة المشتريات
        <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-bold">
          {totalItems} منتجات
        </span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-border rounded-2xl p-4 flex gap-4 items-center shadow-sm relative group">
              <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                {item.imageUri ? (
                  <img src={item.imageUri} alt={item.nameAr} className="w-full h-full object-contain p-2" />
                ) : (
                  <ShoppingBag className="text-gray-300" size={32} />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-text text-lg line-clamp-1">{item.nameAr}</h3>
                <div className="flex flex-col mt-1">
                  {isEligibleForSpecialPrice && item.specialPrice ? (
                    <>
                      <div className="text-red-600 font-black">
                        {item.specialPrice.toLocaleString()} <span className="text-xs">ر.ي</span>
                      </div>
                      <div className="text-gray-400 font-bold text-xs line-through">
                        {item.price.toLocaleString()} ر.ي
                      </div>
                    </>
                  ) : (
                    <div className="text-primary font-black">
                      {item.price.toLocaleString()} <span className="text-xs">ر.ي</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center bg-gray-50 border border-border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:bg-gray-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)}
                className="absolute top-4 left-4 w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 sticky top-24">
            <h2 className="text-xl font-black text-text mb-6">ملخص الطلب</h2>
            
            <div className="space-y-4 text-sm font-medium text-muted mb-6">
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span className="text-text font-bold">{totalPrice.toLocaleString()} ر.ي</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم التوصيل</span>
                <span className="text-green-500 font-bold">مجاناً</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between text-lg">
                <span className="text-text font-black">الإجمالي</span>
                <span className="text-primary font-black">{totalPrice.toLocaleString()} ر.ي</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}

            {!user ? (
              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-border">
                <p className="text-sm font-medium text-muted mb-3">يجب تسجيل الدخول لإتمام الطلب</p>
                <Link to="/login" className="w-full bg-primary text-white font-bold py-3 rounded-xl block hover:bg-primaryDark transition-all">
                  تسجيل الدخول للمتابعة
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text px-1">رقم الهاتف للتواصل</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-border rounded-xl py-3 pr-10 pl-4 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="05XXXXXXXX"
                    />
                    <Phone className="absolute right-3 top-3 text-muted" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text px-1">عنوان التوصيل (المدينة، الحي، الشارع)</label>
                  <div className="relative">
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-50 border border-border rounded-xl py-3 pr-10 pl-4 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      placeholder="اكتب عنوانك بالتفصيل..."
                    />
                    <MapPin className="absolute right-3 top-3 text-muted" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-primaryDark transition-all disabled:opacity-70 shadow-lg shadow-primary/20 hover:shadow-primary/40 mt-6"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (
                    <>إتمام الطلب <ArrowRight size={18} className="rotate-180" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
