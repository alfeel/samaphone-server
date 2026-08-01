// POST /api/admin/reset-password — الإدارة تستعيد كلمة مرور مستخدم.
//
// body: { idToken, targetUid }
// يتحقّق أن الطالب مدير (رمز هويته + دوره في Firestore)، ثم يضبط كلمة
// مرور مؤقتة مباشرةً عبر Admin SDK ويُبلّغها للمستخدم.
//
// لماذا كلمة مؤقتة لا رابط؟ روابط Firebase أحادية الاستخدام، وتوليد رابط
// جديد يُبطل السابق — فمع تكرار الطلب تظهر «انتهت الصلاحية أو استُخدم
// الرابط». الكلمة المؤقتة تعمل فورًا ودائمًا حتى يغيّرها المستخدم، بلا
// انتهاء ولا تعارض بين الطلبات المتكررة.
const admin = require("firebase-admin");
const crypto = require("crypto");

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

  // 1) الطالب مدير فعّال؟
  let caller;
  try { caller = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: "unauthorized", message: "جلسة غير صالحة، أعد الدخول." }); }
  const callerDoc = (await admin.firestore().collection("users").doc(caller.uid).get()).data() || {};
  if (callerDoc.role !== "admin" || callerDoc.active === false) return res.status(403).json({ error: "forbidden", message: "تحتاج صلاحية مدير." });

  // 2) الهدف
  let targetAuth;
  try { targetAuth = await admin.auth().getUser(targetUid); }
  catch { return res.status(404).json({ error: "not_found", message: "الحساب غير موجود." }); }
  const targetDoc = (await admin.firestore().collection("users").doc(targetUid).get()).data() || {};

  // 3) كلمة مرور مؤقتة (سهلة التبليغ، ≥ ٦ خانات) نضبطها مباشرةً
  const temp = "SP" + String(crypto.randomInt(100000, 1000000));
  try { await admin.auth().updateUser(targetUid, { password: temp }); }
  catch { return res.status(500).json({ error: "reset_failed", message: "تعذّر ضبط كلمة المرور." }); }

  // 4) التبليغ: بريد حقيقي → عبر Resend؛ وإلا نُعيدها للإدارة (واتساب/يدويًا)
  const realEmail = targetDoc.email && !String(targetDoc.email).endsWith("@phone.samaphone.local") ? targetDoc.email : null;
  if (realEmail && process.env.RESEND_API_KEY) {
    const html =
      `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E2E8F0;border-radius:16px">` +
      `<h2 style="color:#1B8EF8">سماء فون — استعادة كلمة المرور</h2>` +
      `<p style="color:#334155">ضبطت الإدارة كلمة مرور مؤقتة لحسابك. ادخل بها ثم غيّرها من «حسابي»:</p>` +
      `<div style="font-size:26px;font-weight:800;letter-spacing:3px;color:#0F172A;background:#F1F5F9;border-radius:12px;padding:14px;text-align:center">${temp}</div>` +
      `<p style="color:#64748B;font-size:13px;margin-top:14px">إن لم تطلب ذلك فتواصل مع الإدارة فورًا.</p></div>`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "سماء فون <noreply@samaphone.store>", to: [realEmail], subject: "كلمة مرور مؤقتة — سماء فون", html }),
      });
      if (r.ok) return res.status(200).json({ ok: true, channel: "email", to: realEmail, tempPassword: temp });
    } catch { /* نسقط للتسليم اليدوي */ }
  }
  // حساب رقم أو تعذّر الإرسال → نُعيد الكلمة المؤقتة للإدارة لتبلّغ العميل
  return res.status(200).json({ ok: true, channel: "manual", tempPassword: temp, phone: targetDoc.phone || "" });
};
