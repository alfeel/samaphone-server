// POST /api/push — إرسال دفعة إشعارات.
// الجسم: { messages: [{ to, title, body, data? }, ...] }
//
// مساران: رموز Expo (تبدأ بـExponentPushToken) تُرسَل عبر خدمة Expo،
// ورموز FCM الأصلية تُرسَل مباشرةً عبر firebase-admin بمفتاح الخدمة —
// فتصل أجهزة أندرويد دون الحاجة لرفع بيانات FCM لمشروع Expo.
const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("no_service_account");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  const clean = messages.filter((m) => m && typeof m.to === "string" && m.to.length > 10);
  if (clean.length === 0) return res.status(200).json({ sent: 0 });

  const expo = clean.filter((m) => m.to.startsWith("ExponentPushToken"));
  const fcm = clean.filter((m) => !m.to.startsWith("ExponentPushToken"));
  let sent = 0;

  // ── مسار Expo ──
  try {
    for (let i = 0; i < expo.length; i += 100) {
      const chunk = expo.slice(i, i + 100).map((m) => ({
        to: m.to,
        title: String(m.title || "").slice(0, 120),
        body: String(m.body || "").slice(0, 400),
        sound: "default",
        channelId: "default",
        data: m.data || {},
      }));
      const r = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(chunk),
      });
      if (r.ok) sent += chunk.length;
    }
  } catch (e) { /* نُكمل لمسار FCM */ }

  // ── مسار FCM المباشر (firebase-admin) ──
  if (fcm.length) {
    try {
      initAdmin();
      const msgs = fcm.map((m) => ({
        token: m.to,
        notification: { title: String(m.title || "سماء فون").slice(0, 120), body: String(m.body || "").slice(0, 400) },
        android: { priority: "high", notification: { channelId: "default", sound: "default" } },
        data: Object.fromEntries(Object.entries(m.data || {}).map(([k, v]) => [k, String(v)])),
      }));
      const r = await admin.messaging().sendEach(msgs);
      sent += r.successCount;
    } catch (e) {
      // إن غاب مفتاح الخدمة أو فشل الإرسال — نُعيد ما نجح من Expo دون تعطّل.
    }
  }

  return res.status(200).json({ sent });
};
