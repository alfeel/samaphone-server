import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ELIGIBLE_ROLES_FOR_SPECIAL_PRICE } from '../lib/constants';
import {
  ShoppingBag, ArrowRight, Loader2, CheckCircle2,
  AlertCircle, MessageCircle, Share2, ChevronRight
} from 'lucide-react';

interface Product {
  id: string;
  nameAr: string;
  descriptionAr?: string;
  price: number;
  specialPrice?: number;
  imageUri?: string;
  images?: string[];
  inStock?: boolean;
  categoryId: string;
  subcategoryId?: string;
  specs?: string;
  status?: string;
}

const WHATSAPP_NUMBER = '967783454544';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { userData } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const isEligibleForSpecialPrice = userData?.role && ELIGIBLE_ROLES_FOR_SPECIAL_PRICE.includes(userData.role);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (!snap.exists() || snap.data()?.status !== 'approved') {
          setNotFound(true);
        } else {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const price = displayPrice.toLocaleString();
    const msg = `مرحباً، أريد الاستفسار عن: ${product.nameAr}\nالسعر: ${price} ر.ي`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({ title: product.nameAr, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <AlertCircle size={56} className="text-muted mb-4 opacity-40" />
        <h1 className="text-2xl font-black text-text mb-2">المنتج غير موجود</h1>
        <p className="text-muted font-medium mb-8">هذا المنتج غير متاح أو تمت إزالته</p>
        <Link to="/store" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primaryDark transition-all shadow-lg shadow-primary/20">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const allImages = [
    ...(product.imageUri && /^https?:/.test(product.imageUri) ? [product.imageUri] : []),
    ...(product.images?.filter((img: string) => /^https?:/.test(img)) || []),
  ];

  const displayPrice = isEligibleForSpecialPrice && product.specialPrice
    ? product.specialPrice : product.price;

  const hasSpecial = isEligibleForSpecialPrice && !!product.specialPrice;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted font-semibold mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
        <ChevronRight size={14} className="opacity-40 rotate-180" />
        <Link to="/store" className="hover:text-primary transition-colors">المتجر</Link>
        <ChevronRight size={14} className="opacity-40 rotate-180" />
        <span className="text-text line-clamp-1">{product.nameAr}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8 relative group">
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImg]}
                alt={product.nameAr}
                className="max-w-full max-h-full object-contain transition-all duration-300"
              />
            ) : (
              <span className="text-8xl opacity-15">📱</span>
            )}

            {product.inStock === false && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                  نفذت الكمية
                </span>
              </div>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`w-20 h-20 shrink-0 border-2 rounded-2xl overflow-hidden flex items-center justify-center p-2 transition-all ${
                    idx === activeImg ? 'border-primary shadow-md shadow-primary/20' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6 text-right">

          {/* Title & Badges */}
          <div>
            {hasSpecial && (
              <span className="inline-block bg-red-100 text-red-600 text-xs font-black px-3 py-1 rounded-full mb-3 border border-red-200">
                سعر خاص لك 🎉
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-text leading-tight mb-3">
              {product.nameAr}
            </h1>
            {product.inStock !== false ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                <CheckCircle2 size={16} />
                متوفر في المخزون
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-500 font-bold text-sm">
                <AlertCircle size={16} />
                نفذت الكمية
              </span>
            )}
          </div>

          {/* Price */}
          <div className="bg-gray-50 border border-border rounded-2xl p-5">
            {hasSpecial ? (
              <div className="space-y-1">
                <div className="text-4xl font-black text-red-600">
                  {product.specialPrice!.toLocaleString()} <span className="text-xl">ر.ي</span>
                </div>
                <div className="text-gray-400 font-bold text-lg line-through">
                  {product.price.toLocaleString()} ر.ي
                </div>
                <div className="text-emerald-600 font-bold text-sm">
                  ✅ وفّرت {(product.price - product.specialPrice!).toLocaleString()} ر.ي
                </div>
              </div>
            ) : (
              <div className="text-4xl font-black text-primary">
                {displayPrice.toLocaleString()} <span className="text-xl">ر.ي</span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.descriptionAr && (
            <div>
              <h2 className="font-bold text-text mb-2">الوصف</h2>
              <p className="text-muted font-medium leading-relaxed whitespace-pre-line">
                {product.descriptionAr}
              </p>
            </div>
          )}

          {/* Specs */}
          {product.specs && (
            <div>
              <h2 className="font-bold text-text mb-3">المواصفات</h2>
              <div className="bg-white border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {product.specs.split('\n').filter(Boolean).map((line, i) => {
                  const [key, ...vals] = line.split(':');
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-text font-semibold">{vals.join(':').trim() || key}</span>
                      {vals.length > 0 && <span className="text-muted font-medium">{key.trim()}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={product.inStock === false}
              className={`w-full font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-3 transition-all shadow-lg ${
                added
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-primary text-white hover:bg-primaryDark shadow-primary/20 hover:shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed'
              }`}
            >
              {added ? (
                <><CheckCircle2 size={22} />تمت الإضافة للسلة!</>
              ) : (
                <><ShoppingBag size={22} />إضافة للسلة</>
              )}
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] text-white font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-3 hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={22} />
              استفسار عبر واتساب
            </button>

            <Link
              to="/cart"
              className="w-full border-2 border-primary text-primary font-bold text-base rounded-2xl py-3.5 flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
            >
              عرض السلة
              <ArrowRight size={18} className="rotate-180" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: '🔒', text: 'دفع آمن' },
              { icon: '🚚', text: 'توصيل سريع' },
              { icon: '✅', text: 'جودة مضمونة' },
            ].map(b => (
              <div key={b.text} className="bg-gray-50 border border-border rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{b.icon}</div>
                <div className="text-xs font-bold text-muted">{b.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
