import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Meshkilati from './pages/Meshkilati';
import Cart from './pages/Cart';
import Store from './pages/Store';
import Services from './pages/Services';
import ProductDetail from './pages/ProductDetail';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

function Navbar() {
  const { user, userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 min-h-[4rem] py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 -mr-2 text-muted hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
            <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center shrink-0">📱</span>
            سماء فون
          </Link>
        </div>
        
        <nav className="hidden md:flex flex-wrap items-center gap-4 lg:gap-6 font-semibold text-muted">
          <Link to="/" className="text-primary hover:text-primaryDark transition-colors">الرئيسية</Link>
          <Link to="/store" className="hover:text-primary transition-colors">المتجر</Link>
          <Link to="/services" className="hover:text-primary transition-colors">الخدمات</Link>
          <Link to="/ai" className="hover:text-primary transition-colors">مشكلتي</Link>
          {user && (userData?.role === 'admin' || userData?.role === 'supplier') && (
            <Link to="/admin/products" className="text-red-500 font-bold hover:text-red-700 transition-colors">إدارة المنتجات</Link>
          )}
          {user && userData?.role === 'admin' && (
            <Link to="/admin/users" className="text-blue-500 font-bold hover:text-blue-700 transition-colors">إدارة المستخدمين</Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-muted hover:text-primary transition-colors">
            <Search size={20} />
          </button>
          
          <Link to="/cart" className="p-2 text-muted hover:text-primary transition-colors relative">
            <ShoppingBag size={20} />
            {useCart().totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
                {useCart().totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold hidden md:block">{userData?.displayName || userData?.name || user.displayName || user.email}</span>
              <button 
                onClick={logout}
                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <User size={18} />
              دخول
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white shadow-lg absolute w-full left-0">
          <nav className="flex flex-col p-4 space-y-4 font-semibold text-muted">
            <Link to="/" className="text-primary hover:bg-gray-50 p-2 rounded-lg transition-colors">الرئيسية</Link>
            <Link to="/store" className="hover:text-primary hover:bg-gray-50 p-2 rounded-lg transition-colors">المتجر</Link>
            <Link to="/services" className="hover:text-primary hover:bg-gray-50 p-2 rounded-lg transition-colors">الخدمات</Link>
            <Link to="/ai" className="hover:text-primary hover:bg-gray-50 p-2 rounded-lg transition-colors">مشكلتي</Link>
            {user && (userData?.role === 'admin' || userData?.role === 'supplier') && (
              <Link to="/admin/products" className="text-red-500 font-bold hover:bg-red-50 p-2 rounded-lg transition-colors">إدارة المنتجات</Link>
            )}
            {user && userData?.role === 'admin' && (
              <Link to="/admin/users" className="text-blue-500 font-bold hover:bg-blue-50 p-2 rounded-lg transition-colors">إدارة المستخدمين</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavbarWrapper() {
  return (
    <BrowserRouter>
      <Navbar />
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/store" element={<Store />} />
          <Route path="/services" element={<Services />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/ai" element={<Meshkilati />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin', 'supplier']}><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-primary font-bold text-2xl mb-4 flex items-center justify-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center">📱</span>
            سماء فون
          </div>
          <p className="text-muted mb-6 text-sm md:text-base">متجر الجوالات والإلكترونيات الأول</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm font-semibold text-muted">
            <Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link>
            <a href="mailto:a.alfeel50@gmail.com" className="hover:text-primary transition-colors">اتصل بنا</a>
          </div>
          <div className="mt-8 text-xs text-muted/60">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سماء فون
          </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-[100dvh] flex flex-col">
          <NavbarWrapper />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
