// POST /api/notify-order — تنبيه الأطراف بطلب جديد أو جاهز.
// الجسم: { orderId, event: "new" | "ready" }
//
// العميل لا يستطيع قراءة رموز إشعارات الإدارة/المورد/المناديب (قواعد
// Firestore تمنعه)، فنُشعرهم من الخادم بمفتاح الخدمة:
//  - new   → المورد صاحب المنتج + كل المديرين (طلب معلّق بانتظار المعالجة).
//  - ready → المناديب (طلب جاهز للاستلام) حسب نمط التوزيع.
const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("no_service_account");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

async function pushTo(tokens, title, body, data) {
  const clean = [...new Set(tokens.filter((t) => typeof t === "string" && t.length > 20))];
  if (!clean.length) return 0;
  const fcm = clean.filter((t) => !t.startsWith("ExponentPushToken"));
  const expo = clean.filter((t) => t.startsWith("ExponentPushToken"));
  let sent = 0;
  if (fcm.length) {
    const r = await admin.messaging().sendEach(fcm.map((token) => ({
      token,
      notification: { title, body },
      android: { priority: "high", notification: { channelId: "default", sound: "default" } },
      data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)])),
    })));
    sent += r.successCount;
  }
  for (let i = 0; i < expo.length; i += 100) {
    const chunk = expo.slice(i, i + 100).map((to) => ({ to, title, body, sound: "default", channelId: "default", data: data || {} }));
    const r = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(chunk) });
    if (r.ok) sent += chunk.length;
  }
  return sent;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const orderId = req.body && req.body.orderId;
  const event = (req.body && req.body.event) || "new";
  if (!orderId) return res.status(400).json({ error: "no_order" });
  try {
    initAdmin();
    const db = admin.firestore();
    const snap = await db.collection("orders").doc(String(orderId)).get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });
    const o = snap.data() || {};
    const tokens = [];

    if (event === "ready") {
      // المناديب: إن كان التوزيع خاصًّا بالمورد نُشعر مناديبه فقط، وإلا الجميع.
      let cfg = {};
      try { cfg = (await db.collection("settings").doc("config").get()).data() || {}; } catch (e) {}
      let q = db.collection("users").where("role", "==", "rep");
      const reps = await q.get();
      reps.forEach((d) => {
        const u = d.data() || {};
        if (cfg.dispatchMode === "supplier") {
          const sup = Array.isArray(u.supervisorIds) ? u.supervisorIds : [];
          if (o.supplierId && !sup.includes(o.supplierId)) return;
        }
        if (u.pushToken) tokens.push(u.pushToken);
      });
      const sent = await pushTo(tokens, "طلب جاهز للتوصيل 🛵", `طلب «${o.productName || "منتج"}» جاهز للاستلام.`, { type: "order", orderId });
      return res.status(200).json({ sent });
    }

    // new: المورد + كل المديرين.
    if (o.supplierId) {
      try {
        const sup = await db.collection("users").doc(o.supplierId).get();
        const t = sup.exists && sup.data() && sup.data().pushToken;
        if (t) tokens.push(t);
      } catch (e) {}
    }
    const admins = await db.collection("users").where("role", "==", "admin").get();
    admins.forEach((d) => { const t = d.data() && d.data().pushToken; if (t) tokens.push(t); });
    const sent = await pushTo(tokens, "طلب جديد بانتظار المعالجة 📦", `طلب «${o.productName || "منتج"}» — ${(o.price || 0).toLocaleString()} ر.ي.`, { type: "order", orderId });
    return res.status(200).json({ sent });
  } catch (e) {
    return res.status(200).json({ sent: 0, error: String(e.message || e) });
  }
};
