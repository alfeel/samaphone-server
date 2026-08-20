import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { signInWithGoogle } from '../lib/googleAuth';
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        name,
        email,
        phone: '',
        role: 'user',
        walletBalance: 0,
        rewardsPoints: 0,
        pushToken: null,
        country: '',
        provider: 'email',
        createdAt: serverTimestamp(),
        lastSeenAt: Date.now(),
      });

      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول'
        : err.code === 'auth/weak-password'
        ? 'كلمة المرور ضعيفة، استخدم 6 أحرف أو أكثر'
        : err.message || 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'فشل التسجيل عبر Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="bg-white border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-primary/5 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              🚀
            </div>
            <h1 className="text-3xl font-black text-text mb-2">حساب جديد</h1>
            <p className="text-muted font-medium">انضم إلينا واستمتع بتجربة تسوق مميزة</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-5 text-sm font-semibold border border-red-100 text-right">
              {error}
            </div>
          )}

          {/* Google Register Button */}
          <button
            id="google-register-btn"
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-border text-text font-bold py-3.5 rounded-2xl hover:border-primary/40 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm mb-5"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-primary" />
            ) : (
              <>
                <GoogleIcon />
                <span>التسجيل عبر Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted">أو بالبريد الإلكتروني</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text px-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  id="name-input"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="محمد أحمد"
                />
                <UserIcon className="absolute right-4 top-3.5 text-muted" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text px-1">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="example@mail.com"
                  dir="ltr"
                />
                <Mail className="absolute right-4 top-3.5 text-muted" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text px-1">كلمة المرور</label>
              <div className="relative">
                <input
                  id="password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-2xl py-3.5 pr-12 pl-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="6 أحرف على الأقل"
                />
                <Lock className="absolute right-4 top-3.5 text-muted" size={20} />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary text-white font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-primaryDark transition-all disabled:opacity-70 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'إنشاء الحساب'}
            </button>
          </form>

          {/* Trust note */}
          <p className="text-center text-xs text-muted font-medium mt-5">
            بالتسجيل أنت توافق على{' '}
            <Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
            {' '}و{' '}
            <Link to="/terms" className="text-primary hover:underline">الشروط والأحكام</Link>
          </p>

          <div className="mt-5 text-center text-sm font-medium text-muted">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              تسجيل الدخول <ArrowRight size={14} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
