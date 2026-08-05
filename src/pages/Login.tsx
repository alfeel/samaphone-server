import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="bg-white border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-primary/5 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-text mb-2">أهلاً بك مجدداً 👋</h1>
            <p className="text-muted font-medium">سجل دخولك للوصول إلى المتجر والخدمات</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text px-1">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="example@mail.com"
                />
                <Mail className="absolute right-4 top-3.5 text-muted" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text px-1">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-4 top-3.5 text-muted" size={20} />
              </div>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm font-bold text-primary hover:underline">نسيت كلمة المرور؟</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-primaryDark transition-all disabled:opacity-70 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-muted">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              إنشاء حساب جديد <ArrowRight size={14} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
