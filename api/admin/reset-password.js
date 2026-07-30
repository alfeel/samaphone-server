// POST /api/admin/reset-password — الإدارة تستعيد كلمة مرور مستخدم.
//
// body: { idToken, targetUid }
// يتحقّق أن الطالب مدير (بفحص رمز هويته + دوره في Firestore)، ثم يولّد
// رابط استعادة كلمة المرور (Admin SDK). التسليم: بريد حقيقي موثّق →
// عبر Resend؛ وإلا يُعيد الرابط للإدارة لتبعثه للعميل عبر واتساب.
//
// لا نضبط كلمة مرور نصّية ولا نكشفها — رابط Firebase يتيح للمستخدم
// تعيين كلمته بنفسه.
const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("no_service_account");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try { initAdmin(); }
  catch { return res.status(500).json({ error: "not_configured", message: "خدمة الإدارة غير مضبوطة على الخادم." }); }

  const { idToken, targetUid } = req.body || {};
  if (!idToken || !targetUid) return res.status(400).json({ error: "bad_request", message: "بيانات ناقصة." });

  // 1) الطالب مدير؟
  let caller;
  try { caller = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: "unauthorized", message: "جلسة غير صالحة، أعد الدخول." }); }
  const callerDoc = (await admin.firestore().collection("users").doc(caller.uid).get()).data() || {};
  if (callerDoc.role !== "admin") return res.status(403).json({ error: "forbidden", message: "تحتاج صلاحية مدير." });

  // 2) الهدف
  let targetAuth;
  try { targetAuth = await admin.auth().getUser(targetUid); }
  catch { return res.status(404).json({ error: "not_found", message: "الحساب غير موجود." }); }
  const targetDoc = (await admin.firestore().collection("users").doc(targetUid).get()).data() || {};

  // 3) رابط الاستعادة (لبريد المصادقة — داخليًا كان أو حقيقيًا)
  let link;
  try { link = await admin.auth().generatePasswordResetLink(targetAuth.email); }
  catch { return res.status(500).json({ error: "link_failed", message: "تعذّر توليد رابط الاستعادة." }); }

  // 4) التسليم
  const realEmail = targetDoc.email && !String(targetDoc.email).endsWith("@phone.samaphone.local") ? targetDoc.email : null;
  if (realEmail && process.env.RESEND_API_KEY) {
    const html =
      `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E2E8F0;border-radius:16px">` +
      `<h2 style="color:#1B8EF8">سما فون — استعادة كلمة المرور</h2>` +
      `<p style="color:#334155">أرسلت الإدارة رابطًا لتعيين كلمة مرور جديدة لحسابك:</p>` +
      `<p><a href="${link}" style="display:inline-block;background:#1B8EF8;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700">تعيين كلمة مرور جديدة</a></p>` +
      `<p style="color:#64748B;font-size:13px">إن لم تطلب ذلك فتجاهل الرسالة.</p></div>`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "سما فون <noreply@samaphone.store>", to: [realEmail], subject: "استعادة كلمة المرور — سما فون", html }),
      });
      if (r.ok) return res.status(200).json({ ok: true, channel: "email", to: realEmail });
    } catch { /* نسقط للتسليم اليدوي */ }
  }
  // بريد داخلي (حساب رقم) أو تعذّر الإرسال → نُعيد الرابط للإدارة (واتساب)
  return res.status(200).json({ ok: true, channel: "manual", link, phone: targetDoc.phone || "" });
};
