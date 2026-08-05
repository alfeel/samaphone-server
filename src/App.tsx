import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Search, User, ShieldAlert, Star } from 'lucide-react';

// Temporary components for preview
const Home = () => (
  <div className="p-8">
    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center mb-8">
      <h1 className="text-3xl font-bold text-primary mb-4">مرحباً بك في سماء فون</h1>
      <p className="text-muted text-lg">النسخة الجديدة كلياً من المتجر الإلكتروني تحت التطوير 🚀</p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { title: 'المنتجات', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'البحث المتقدم', icon: Search, color: 'text-purple-500', bg: 'bg-purple-50' },
        { title: 'مشكلتي (AI)', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
        { title: 'المكافآت', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      ].map((feat, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className={`${feat.bg} ${feat.color} p-4 rounded-full group-hover:scale-110 transition-transform`}>
            <feat.icon size={24} />
          </div>
          <span className="font-semibold text-text">{feat.title}</span>
        </div>
      ))}
    </div>
  </div>
);

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
      </div>
    </BrowserRouter>
  );
}

export default App;
