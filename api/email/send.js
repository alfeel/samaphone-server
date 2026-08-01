// POST /api/email/send — يرسل رمز تحقق إلى بريد عبر Resend.
//
// عديم الحالة وآمن: الرمز يُشفَّر (AES-256-GCM) داخل token يُعاد للعميل،
// فلا يمكنه قراءته أو تخمينه. عند التحقق يفكّه الخادم ويقارن. المفتاح
// مشتقّ من RESEND_API_KEY (سرّ خادم لا يغادره).
const crypto = require("crypto");

function keyBuf() {
  return crypto.createHash("sha256").update(process.env.RESEND_API_KEY || "").digest();
}
function enc(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", keyBuf(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64url");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: "not_configured", message: "خدمة البريد غير مضبوطة على الخادم." });

  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "bad_email", message: "أدخل بريدًا إلكترونيًا صحيحًا." });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = Date.now() + 10 * 60 * 1000; // ١٠ دقائق
  const token = enc({ email, code, exp });

  const html =
    `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E2E8F0;border-radius:16px">` +
    `<h2 style="color:#1B8EF8;margin:0 0 8px">سماء فون — رمز التحقق</h2>` +
    `<p style="color:#334155">رمز تحقّق بريدك:</p>` +
    `<div style="font-size:30px;font-weight:800;letter-spacing:6px;color:#0F172A;background:#F1F5F9;border-radius:12px;padding:14px;text-align:center">${code}</div>` +
    `<p style="color:#64748B;font-size:13px;margin-top:14px">صالح لمدة ١٠ دقائق. إن لم تطلبه فتجاهل هذه الرسالة.</p></div>`;

  // نسخة نصية صريحة ترفع تقييم التسليم وتقلّل تصنيفه «غير مرغوب».
  const text = `سماء فون — رمز التحقق\nرمز تحقّق بريدك: ${code}\nصالح لمدة 10 دقائق. إن لم تطلبه فتجاهل هذه الرسالة.`;

  let r, data;
  try {
    r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "سماء فون <noreply@samaphone.store>",
        to: [email],
        reply_to: "support@samaphone.store",
        subject: `رمز تحقّق سماء فون: ${code}`,
        html,
        text,
        headers: { "List-Unsubscribe": "<mailto:support@samaphone.store>" },
      }),
    });
    data = await r.json().catch(() => ({}));
  } catch (e) {
    return res.status(502).json({ error: "network", message: "تعذّر الاتصال بخدمة البريد." });
  }
  if (!r.ok) {
    // نمرّر رسالة Resend للمساعدة في التشخيص (نطاق غير موثّق / مفتاح خاطئ).
    return res.status(502).json({ error: "send_failed", message: data && data.message ? data.message : "تعذّر إرسال البريد.", resend: data });
  }
  return res.status(200).json({ ok: true, exp, token, id: data && data.id });
};
