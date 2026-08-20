import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Wrench, Code2, Star, Clock, CheckCircle2, Loader2, MessageCircle, Phone } from 'lucide-react';

interface WorkItem {
  id: string;
  titleAr: string;
  descriptionAr: string;
  type: 'maintenance' | 'programming' | 'other';
  imageUri?: string;
  createdAt?: any;
}

const TYPE_CONFIG = {
  maintenance: {
    label: 'صيانة',
    icon: Wrench,
    color: '#1B8EF8',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
    border: 'border-blue-100',
  },
  programming: {
    label: 'برمجة',
    icon: Code2,
    color: '#7C3AED',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600',
    border: 'border-purple-100',
  },
  other: {
    label: 'أخرى',
    icon: Star,
    color: '#059669',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    border: 'border-emerald-100',
  },
};

const FEATURES = [
  { icon: '⚡', title: 'صيانة سريعة', desc: 'إصلاح معظم الأعطال في نفس اليوم' },
  { icon: '🔒', title: 'ضمان شامل', desc: 'ضمان على جميع خدمات الصيانة' },
  { icon: '🧰', title: 'قطع أصلية', desc: 'نستخدم قطع غيار أصلية معتمدة' },
  { icon: '👨‍🔧', title: 'فنيون متخصصون', desc: 'فريق مدرّب ومعتمد بخبرة واسعة' },
];

const WHATSAPP_NUMBER = '967783454544';

export default function Services() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'maintenance' | 'programming' | 'other'>('all');

  useEffect(() => {
    const fetchWorkItems = async () => {
      try {
        const q = query(collection(db, 'workItems'), where('status', '==', 'published'));
        const snap = await getDocs(q);
        const items = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...d.data()
        } as WorkItem));
        setWorkItems(items);
      } catch (err) {
        // إذا لم تكن المجموعة موجودة نعرض قائمة فارغة
        setWorkItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkItems();
  }, []);

  const filtered = filter === 'all' ? workItems : workItems.filter(w => w.type === filter);

  const openWhatsApp = (msg = 'مرحباً، أريد الاستفسار عن خدمات الصيانة') => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8 space-y-12">

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-blue-600 to-indigo-800 rounded-3xl overflow-hidden text-white p-8 md:p-12 text-right">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-10 w-48 h-48 bg-black/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            🔧 مركز الصيانة المعتمد
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            خدمات الصيانة<br />والبرمجة المتخصصة
          </h1>
          <p className="text-white/80 font-medium text-lg mb-8">
            نصلح جوالك وجهازك بسرعة واحترافية مع ضمان على جميع الخدمات
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openWhatsApp()}
              className="bg-white text-primary font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
            >
              <MessageCircle size={20} />
              احجز موعداً الآن
            </button>
            <a
              href="tel:+967783454544"
              className="bg-white/20 backdrop-blur-md text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Phone size={20} />
              اتصل بنا
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-black text-text mb-6 text-right">لماذا سماء فون؟</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5 text-right hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-text mb-1">{f.title}</h3>
              <p className="text-muted text-sm font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services Categories */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="text-right">
            <h2 className="text-2xl font-black text-text">من أعمالنا</h2>
            <p className="text-muted font-medium mt-1">نماذج حقيقية من الخدمات التي قدمناها</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {(['all', 'maintenance', 'programming', 'other'] as const).map(f => {
              const label = f === 'all' ? 'الكل' : TYPE_CONFIG[f].label;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    filter === f ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white border border-border text-muted hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border rounded-3xl">
            <Wrench size={48} className="mx-auto mb-4 text-muted opacity-40" />
            <h3 className="text-xl font-bold text-text mb-2">لا توجد أعمال بعد</h3>
            <p className="text-muted font-medium">سيتم إضافة نماذج من أعمالنا قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => {
              const tc = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
              const Icon = tc.icon;
              return (
                <div key={item.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {item.imageUri && /^https?:/.test(item.imageUri) && (
                    <img
                      src={item.imageUri}
                      alt={item.titleAr}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-5 text-right">
                    <div className={`inline-flex items-center gap-2 ${tc.bg} ${tc.textColor} px-3 py-1.5 rounded-full text-xs font-bold mb-3 border ${tc.border}`}>
                      <Icon size={14} />
                      {tc.label}
                    </div>
                    <h3 className="font-bold text-text text-lg mb-2 leading-snug">{item.titleAr}</h3>
                    <p className="text-muted text-sm font-medium leading-relaxed line-clamp-3">{item.descriptionAr}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-semibold">مع ضمان الجودة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Steps */}
      <div className="bg-white border border-border rounded-3xl p-8 text-right">
        <h2 className="text-2xl font-black text-text mb-8">كيف تطلب الخدمة؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { num: '01', icon: '💬', title: 'تواصل معنا', desc: 'عبر واتساب أو من خلال خاصية "مشكلتي"' },
            { num: '02', icon: '🔍', title: 'تشخيص المشكلة', desc: 'يتم فحص الجهاز وتحديد المشكلة بدقة' },
            { num: '03', icon: '🔧', title: 'الإصلاح', desc: 'يبدأ فريقنا المتخصص في الإصلاح الفوري' },
            { num: '04', icon: '✅', title: 'التسليم', desc: 'استلم جهازك مُصلحاً مع ضمان الجودة' },
          ].map(step => (
            <div key={step.num} className="relative">
              <div className="text-5xl font-black text-gray-100 absolute -top-2 -right-1 select-none">{step.num}</div>
              <div className="relative">
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-bold text-text mb-1">{step.title}</h3>
                <p className="text-muted text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-l from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-right flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2">هل لديك جهاز معطّل؟</h2>
          <p className="text-white/85 font-medium">تواصل معنا الآن وسنصلحه بأسرع وقت وأقل تكلفة</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => openWhatsApp('مرحباً، عندي جهاز معطّل وأريد الصيانة')}
            className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <MessageCircle size={20} />
            تواصل عبر واتساب
          </button>
        </div>
      </div>

      {/* Work Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Clock, title: 'ساعات العمل', value: 'السبت - الخميس', sub: '9 صباحاً - 9 مساءً' },
          { icon: Phone, title: 'هاتف التواصل', value: '+967 783 454 544', sub: 'واتساب وإتصال' },
          { icon: CheckCircle2, title: 'وقت الإصلاح', value: 'نفس اليوم', sub: 'لمعظم الأعطال الشائعة' },
        ].map(({ icon: Icon, title, value, sub }) => (
          <div key={title} className="bg-white border border-border rounded-2xl p-5 text-right flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <Icon size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold mb-0.5">{title}</p>
              <p className="text-text font-bold">{value}</p>
              <p className="text-muted text-xs font-medium">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
