// نقطة فحص مؤقتة — تنادي Gemini بأبسط طلب وتُظهر حالته ومقتطفًا من الرد،
// لتشخيص سبب غياب المحتوى. لا تكشف المفتاح إطلاقًا. تُحذف بعد التشخيص.
module.exports = async (req, res) => {
  const key = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  if (!key) return res.status(200).json({ error: "no_key" });
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "قل: مرحبا" }] }],
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    const bodyText = await r.text();
    res.status(200).json({
      upstreamStatus: r.status,
      ok: r.ok,
      model,
      // مقتطف آمن: أول 600 حرف من رد Gemini (رسالة الخطأ إن وُجدت)
      snippet: bodyText.slice(0, 600),
    });
  } catch (e) {
    res.status(200).json({ error: e.name + ": " + e.message });
  }
};
