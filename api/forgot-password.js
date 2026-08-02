// POST /api/forgot-password — استعادة ذاتية لكلمة المرور عبر بريدنا الموثّق.
// body: { email }
//
// لماذا عبر الخادم؟ بريد Firebase الافتراضي (noreply@<project>.firebaseapp.com)
// يذهب غالبًا لـ«غير المرغوب». نولّد رابط الاستعادة بمفتاح الخدمة ونرسله
// عبر Resend من نطاقنا الموثّق (samaphone.store، SPF/DKIM) فيصل الأساسي.
// آمن: الرابط أحادي الاستخدام ولا يعمل إلا لمالك البريد.
const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("no_service_account");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "bad_email", message: "أدخل بريدًا صحيحًا." });
  if (email.endsWith("@phone.samaphone.local")) return res.status(400).json({ error: "phone_account", message: "حساب بالرقم فقط — اطلب من الإدارة إعادة التعيين." });

  try { initAdmin(); }
  catch { return res.status(500).json({ error: "not_configured", message: "الخدمة غير مضبوطة على الخادم." }); }

  // نتحقق من وجود المستخدم بهدوء — لا نكشف إن كان البريد مسجّلًا (لا تعداد).
  let exists = true;
  try { await admin.auth().getUserByEmail(email); }
  catch { exists = false; }

  if (exists && process.env.RESEND_API_KEY) {
    let link;
    try { link = await admin.auth().generatePasswordResetLink(email); }
    catch { link = null; }
    if (link) {
      const html =
        `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E2E8F0;border-radius:16px">` +
        `<h2 style="color:#1B8EF8">سماء فون — استعادة كلمة المرور</h2>` +
        `<p style="color:#334155">طلبتَ إعادة تعيين كلمة مرور حسابك. اضغط الزر لتعيين كلمة جديدة:</p>` +
        `<p><a href="${link}" style="display:inline-block;background:#1B8EF8;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700">تعيين كلمة مرور جديدة</a></p>` +
        `<p style="color:#64748B;font-size:13px">إن لم تطلب ذلك فتجاهل هذه الرسالة — حسابك آمن.</p></div>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "سماء فون <noreply@samaphone.store>", to: [email], subject: "استعادة كلمة المرور — سماء فون", html }),
        });
      } catch { /* نتجاهل — نُعيد ok دائمًا */ }
    }
  }
  // نُعيد ok دائمًا (سواء وُجد البريد أم لا) لمنع تعداد الحسابات.
  return res.status(200).json({ ok: true });
};
