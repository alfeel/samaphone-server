import { useEffect, useState } from 'react';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingBag, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ELIGIBLE_ROLES_FOR_SPECIAL_PRICE } from '../lib/constants';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  nameAr: string;
  descriptionAr?: string;
  price: number;
  specialPrice?: number;
  imageUri?: string;
  inStock?: boolean;
  categoryId: string;
  subcategoryId?: string;
  specs?: string;
}

interface Category {
  id: string;
  nameAr: string;
  emoji?: string;
  subcategories?: { id: string; nameAr: string }[];
}

export default function Store() {
  const { addToCart } = useCart();
  const { userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const isEligibleForSpecialPrice = userData?.role && ELIGIBLE_ROLES_FOR_SPECIAL_PRICE.includes(userData.role);

  useEffect(() => {
    // 1. Fetch Categories
    const unsubCategories = onSnapshot(doc(db, 'settings', 'categories'), (docSnap) => {
      if (docSnap.exists()) {
        const items = docSnap.data().items || [];
        setCategories([{ id: 'all', nameAr: 'الكل', emoji: '🛍️' }, ...items]);
      }
    });

    // 2. Fetch Products
    const q = query(collection(db, 'products'), where('status', '==', 'approved'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching store data:', error);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const getDisplayPrice = (product: Product) =>
    isEligibleForSpecialPrice && product.specialPrice ? product.specialPrice : product.price;

  const filteredProducts = products
    .filter(p => {
      const matchCat = activeCat === 'all' || p.categoryId === activeCat;
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        (p.nameAr || '').toLowerCase().includes(q) ||
        (p.descriptionAr || '').toLowerCase().includes(q) ||
        (p.specs || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return getDisplayPrice(a) - getDisplayPrice(b);
      if (sortBy === 'price_desc') return getDisplayPrice(b) - getDisplayPrice(a);
      return 0;
    });

  return (
    <div className="min-h-[80vh] p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-text mb-2 flex items-center gap-3">
          <span className="bg-primary/10 p-2 rounded-2xl text-2xl">🛍️</span>
          المتجر
        </h1>
        <p className="text-muted font-medium">
          تصفح {products.length} منتج من أفضل العلامات التجارية
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 mb-6 max-w-3xl">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث عن منتج، موديل، مواصفات..."
            className="w-full bg-white border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute right-4 top-3.5 text-muted hover:text-primary transition-colors">
              <X size={20} />
            </button>
          ) : (
            <Search className="absolute right-4 top-3.5 text-muted" size={20} />
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3.5 rounded-2xl border font-semibold flex items-center gap-2 transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted hover:border-primary/50'}`}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">فلترة</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
          <span className="text-sm font-bold text-text">الترتيب:</span>
          {[
            { id: 'default', label: 'الافتراضي' },
            { id: 'price_asc', label: 'السعر ↑' },
            { id: 'price_desc', label: 'السعر ↓' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id as typeof sortBy)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${sortBy === opt.id ? 'bg-primary text-white' : 'bg-gray-50 text-muted hover:bg-gray-100'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
              activeCat === cat.id
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-white text-text border border-border hover:border-primary/50 hover:text-primary'
            }`}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            {cat.nameAr}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted font-medium mb-4">
          {filteredProducts.length === 0 ? 'لا توجد نتائج' : `${filteredProducts.length} منتج`}
          {search && ` لـ "${search}"`}
        </p>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <ShoppingBag size={56} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-text mb-2">لا توجد منتجات</h2>
          <p className="font-medium mb-6">
            {search ? `لا نتائج لـ "${search}"` : 'لا توجد منتجات في هذا القسم حالياً'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primaryDark transition-all">
              مسح البحث
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map(product => {
            const displayPrice = getDisplayPrice(product);
            const hasSpecial = isEligibleForSpecialPrice && product.specialPrice;
            const isAdded = addedIds.has(product.id);
            return (
              <div
                key={product.id}
                className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Product Image */}
                <Link to={`/product/${product.id}`} className="block relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                  {product.imageUri && /^(https?:|data:)/.test(product.imageUri) ? (
                    <img
                      src={product.imageUri}
                      alt={product.nameAr}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-5xl opacity-20">📱</span>
                  )}
                  {product.inStock === false && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-lg">نفذت الكمية</span>
                    </div>
                  )}
                  {hasSpecial && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                      سعر خاص
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/product/${product.id}`} className="block flex-1">
                    <h3 className="font-bold text-text text-sm md:text-base line-clamp-2 leading-snug mb-3 hover:text-primary transition-colors">
                      {product.nameAr}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      {hasSpecial ? (
                        <>
                          <div className="text-red-600 font-black text-base">
                            {product.specialPrice!.toLocaleString()} <span className="text-xs">ر.ي</span>
                          </div>
                          <div className="text-gray-400 text-xs line-through">
                            {product.price.toLocaleString()} ر.ي
                          </div>
                        </>
                      ) : (
                        <div className="text-primary font-black text-base">
                          {displayPrice.toLocaleString()} <span className="text-xs">ر.ي</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.inStock === false}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isAdded
                          ? 'bg-green-500 text-white scale-95'
                          : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isAdded ? '✓' : <ShoppingBag size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
