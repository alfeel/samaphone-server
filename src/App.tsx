import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Search, User } from 'lucide-react';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center">📱</span>
              سماء فون
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 font-semibold text-muted">
              <Link to="/" className="text-primary">الرئيسية</Link>
              <Link to="/store" className="hover:text-primary transition-colors">المتجر</Link>
              <Link to="/services" className="hover:text-primary transition-colors">الخدمات</Link>
              <Link to="/ai" className="hover:text-primary transition-colors">مشكلتي</Link>
            </nav>

            <div className="flex items-center gap-4">
              <button className="p-2 text-muted hover:text-primary transition-colors">
                <Search size={20} />
              </button>
              <button className="p-2 text-muted hover:text-primary transition-colors relative">
                <ShoppingBag size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <User size={18} />
                دخول
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-border py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="text-primary font-bold text-2xl mb-4">📱 سماء فون</div>
            <p className="text-muted mb-6">متجر الجوالات والإلكترونيات الأول</p>
            <div className="flex items-center justify-center gap-6 text-sm font-semibold text-muted">
              <Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link>
              <a href="mailto:a.alfeel50@gmail.com" className="hover:text-primary transition-colors">اتصل بنا</a>
            </div>
            <div className="mt-8 text-xs text-muted/60">
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سماء فون
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
