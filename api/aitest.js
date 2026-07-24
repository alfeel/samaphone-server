// فحص مؤقت — يطابق طلب الإنتاج (systemInstruction + responseSchema) ويعيد
// البنية الكاملة لرد Gemini لتشخيص سبب غياب/رفض المحتوى. يُحذف بعد التشخيص.
const SYS = `أنت مساعد فني في متجر "سماء فون" للهواتف والكمبيوتر.
مجالك: صيانة وبرمجة الهواتف والكمبيوتر. أي سؤال خارج ذلك ارفضه واجعل inScope=false.
عند سؤال داخل المجال اشرح الحل واجعل inScope=true.`;
const SCHEMA = {
  type: "object",
  properties: {
    inScope: { type: "boolean" },
    answer: { type: "string" },
    needsCenter: { type: "boolean" },
    category: { type: "string", enum: ["phone_hardware", "phone_software", "computer", "out_of_scope"] },
  },
  required: ["inScope", "answer", "needsCenter", "category"],
};
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
          systemInstruction: { parts: [{ text: SYS }] },
          contents: [{ role: "user", parts: [{ text: "شاشة هاتفي مكسورة وأريد استبدالها" }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    const bodyText = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(bodyText); } catch {}
    res.status(200).json({
      upstreamStatus: r.status,
      ok: r.ok,
      finishReason: parsed?.candidates?.[0]?.finishReason || null,
      promptFeedback: parsed?.promptFeedback || null,
      partsMeta: (parsed?.candidates?.[0]?.content?.parts || []).map((p) => ({
        thought: !!p.thought,
        hasText: typeof p.text === "string",
        textLen: (p.text || "").length,
        textHead: (p.text || "").slice(0, 120),
      })),
      rawHead: bodyText.slice(0, 400),
    });
  } catch (e) {
    res.status(200).json({ error: e.name + ": " + e.message });
  }
};
