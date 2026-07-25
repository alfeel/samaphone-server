// دالة Vercel — POST /api/push. تمرّر دفعة إشعارات لخدمة Expo Push.
// الجسم: { messages: [{ to, title, body, data? }, ...] }.
// خدمة Expo Push مجانية ولا تتطلب مفتاحًا؛ الوسيط هنا يوحّد النداء
// ويتجنّب قيود الشبكة/CORS من التطبيق، ويقصّ الدفعات إلى 100 (حدّ Expo).
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  const valid = messages
    .filter((m) => m && typeof m.to === "string" && m.to.startsWith("ExponentPushToken"))
    .map((m) => ({
      to: m.to,
      title: String(m.title || "").slice(0, 120),
      body: String(m.body || "").slice(0, 400),
      sound: "default",
      channelId: "default",
      data: m.data || {},
    }));
  if (valid.length === 0) return res.status(200).json({ sent: 0 });

  try {
    let sent = 0;
    // Expo يقبل حتى 100 رسالة لكل طلب.
    for (let i = 0; i < valid.length; i += 100) {
      const chunk = valid.slice(i, i + 100);
      const r = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (r.ok) sent += chunk.length;
    }
    return res.status(200).json({ sent });
  } catch (e) {
    return res.status(502).json({ error: "push_failed", message: e.message });
  }
};
