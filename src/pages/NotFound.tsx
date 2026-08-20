import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h1 className="text-9xl font-black text-gray-200 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-text mb-2">الصفحة غير موجودة</h2>
      <p className="text-muted font-medium mb-8">عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
      <Link to="/" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primaryDark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center gap-2">
        <Home size={20} />
        العودة للرئيسية
      </Link>
    </div>
  );
}
