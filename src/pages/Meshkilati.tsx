import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, AlertCircle, Wrench, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
  needsCenter?: boolean;
}

export default function Meshkilati() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'أهلاً بك في خدمة مشكلتي! 🤖\nأنا هنا لمساعدتك في حل أي مشكلة تقنية تواجهك في هاتفك أو جهاز الكمبيوتر الخاص بك. تفضل بطرح مشكلتك..',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: userMessage.text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ غير متوقع');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.answer,
        needsCenter: data.needsCenter,
        isError: !data.inScope && data.category === 'out_of_scope',
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: error.message || 'عذراً، تعذر الاتصال بالخادم حالياً. يرجى المحاولة لاحقاً.',
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-gray-50/50">
      <div className="bg-white border-b border-border py-4 px-6 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full text-primary">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">مشكلتي (الذكاء الاصطناعي)</h1>
          <p className="text-sm text-muted font-medium">مساعدك التقني الذكي على مدار الساعة</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={`p-4 rounded-2xl break-words ${
                msg.sender === 'user' 
                  ? 'bg-primary text-white rounded-tl-none' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-800 border border-red-100 rounded-tr-none'
                    : 'bg-white border border-border text-text rounded-tr-none shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base break-words">
                  {msg.text}
                </div>
                
                {msg.needsCenter && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-3 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <Wrench size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">تتطلب صيانة في المركز</h4>
                      <p className="text-xs mt-1 font-medium text-orange-700/80">هذه المشكلة تحتاج لفحص متخصص. يرجى زيارة أقرب فرع لسماء فون لمعاينتها وإصلاحها بأمان.</p>
                      <button className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors">
                        حجز موعد صيانة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-border rounded-2xl rounded-tr-none p-4 shadow-sm flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-sm font-medium text-muted">جاري التفكير...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-border p-4">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب مشكلتك التقنية هنا..."
            className="flex-1 bg-gray-50 border border-border rounded-full py-4 pr-6 pl-14 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute left-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-full flex items-center justify-center hover:bg-primaryDark transition-all disabled:opacity-50 disabled:hover:bg-primary"
          >
            <Send size={18} className="mr-1" />
          </button>
        </form>
        <p className="text-center text-xs text-muted/60 mt-3 font-medium flex items-center justify-center gap-1">
          <AlertCircle size={12} />
          هذا المساعد مخصص للمشاكل التقنية وصيانة الأجهزة فقط.
        </p>
      </div>
    </div>
  );
}
