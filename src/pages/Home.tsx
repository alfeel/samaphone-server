import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingBag, Search } from 'lucide-react';

interface Product {
  id: string;
  nameAr: string;
  price: number;
  imageUri?: string;
  inStock?: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  nameAr: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const catDoc = await getDoc(doc(db, 'settings', 'categories'));
        if (catDoc.exists()) {
          const items = catDoc.data().items || [];
          setCategories([{ id: 'all', nameAr: 'الكل' }, ...items]);
        }

        // Fetch Products
        const q = query(collection(db, 'products'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const prods = querySnapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({ id: docSnap.id, ...docSnap.data() } as Product));
        setProducts(prods);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCat = activeCat === 'all' || p.categoryId === activeCat;
    const matchSearch = search.trim() === '' || (p.nameAr || '').includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 md:p-8">
      {/* Search Bar */}
      <div className="relative mb-8 max-w-2xl mx-auto">
        <input 
          type="text"
          placeholder="ابحث عن منتج..."
          className="w-full bg-white border border-border rounded-2xl py-4 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute right-4 top-4 text-muted" size={24} />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeCat === cat.id 
                ? 'bg-primary text-white shadow-md shadow-primary/30' 
                : 'bg-white text-text border border-border hover:border-primary/50'
            }`}
          >
            {cat.nameAr}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">لا توجد منتجات مطابقة للبحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                {product.imageUri && /^(https?:|data:)/.test(product.imageUri) ? (
                  <img src={product.imageUri} alt={product.nameAr} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-5xl opacity-20">📱</span>
                )}
                {product.inStock === false && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold text-sm">نفذت الكمية</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-text line-clamp-2 leading-snug mb-2 flex-1">
                  {product.nameAr}
                </h3>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-primary font-black text-lg">
                    {product.price?.toLocaleString()} <span className="text-xs font-bold">ر.ي</span>
                  </div>
                  <button 
                    disabled={product.inStock === false}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary"
                  >
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
