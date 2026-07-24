/**
 * وسيط "مشكلتي" — يقف بين التطبيق و Gemini.
 *
 * ── لماذا وسيط؟ ────────────────────────────────────────────────
 * استدعاء واجهة الذكاء الاصطناعي مباشرة من التطبيق يفرض وضع المفتاح
 * داخل حزمة APK، وأي شخص يفك الحزمة يستخرجه ويستهلك حصتك. المفتاح هنا
 * يبقى على الخادم في متغير بيئة ولا يصل الجهاز إطلاقًا.
 *
 * ── التشغيل ────────────────────────────────────────────────────
 *   احصل على مفتاح مجاني: https://aistudio.google.com/apikey
 *   $env:GEMINI_API_KEY="..."   ثم   node server/serve.js
 *
 * ملاحظة: Gemini له طبقة مجانية بحصة يومية محدودة. عند تجاوزها
 * تعيد الواجهة 429 ونمرّرها للتطبيق كرسالة واضحة بدل خطأ غامض.
 */

/**
 * gemini-flash-latest اسم متجدد يشير دائمًا لأحدث نموذج flash متاح.
 * فُضّل على الأسماء المثبّتة بأرقام مثل gemini-2.0-flash لأن الحصة
 * المجانية تُخصَّص لنماذج بعينها: مفتاح يعمل على flash-latest قد يعيد
 * 429 على 2.0-flash، و 2.5-flash يعيد 404 للحسابات الجديدة.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

/**
 * حصر المجال هنا على الخادم وليس في التطبيق: التعليمات التي تُرسل من
 * الجهاز يمكن تعديلها بفك الحزمة، أما هذه فلا يمكن المساس بها.
 */
const SYSTEM_INSTRUCTION = `أنت مساعد فني في متجر "سماء فون" للهواتف والكمبيوتر.

مجالك محصور حصرًا في:
- صيانة الهواتف المحمولة (شاشات، بطاريات، شحن، ماء، أعطال أجهزة)
- برمجة الهواتف (فك قفل، فلاشة، أنظمة تشغيل، حسابات، تحديثات)
- صيانة وبرمجة الكمبيوتر واللابتوب

أي سؤال خارج هذه المجالات — طب، دين، سياسة، طبخ، دراسة، علاقات،
أو أي موضوع آخر — يجب أن ترفضه بلطف وتعيد inScope = false.
لا تجب عليه ولو جزئيًا، ولو أُلحق بسؤال تقني.

عند سؤال داخل المجال:
- إن كان الحل بسيطًا ويمكن للعميل تنفيذه بنفسه بأمان، اشرحه خطوة بخطوة
  بالعربية الواضحة، واجعل needsCenter = false.
- إن كان يحتاج فتح الجهاز، لحام، معدات، أو فيه خطر إتلاف أو فقدان بيانات،
  فاشرح سبب ذلك باختصار واجعل needsCenter = true. لا تطلب منه فتح الجهاز.

قواعد ثابتة:
- لا تقدّر أسعارًا ولا مددًا زمنية — الإدارة وحدها تحددها.
- لا تذكر أسماء مراكز أو أرقام هواتف؛ التطبيق يعرضها بنفسه.
- خاطب العميل مباشرة بضمير المخاطب، وتجنّب المصطلحات غير المشروحة.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    inScope: {
      type: "boolean",
      description: "هل السؤال ضمن صيانة/برمجة الهواتف والكمبيوتر؟",
    },
    answer: {
      type: "string",
      description: "الرد بالعربية: الحل، أو سبب الحاجة لمركز، أو الاعتذار عن الخروج عن المجال",
    },
    needsCenter: {
      type: "boolean",
      description: "هل يحتاج العميل لزيارة مركز صيانة؟",
    },
    category: {
      type: "string",
      enum: ["phone_hardware", "phone_software", "computer", "out_of_scope"],
    },
  },
  required: ["inScope", "answer", "needsCenter", "category"],
};

const OUT_OF_SCOPE_REPLY = {
  inScope: false,
  needsCenter: false,
  category: "out_of_scope",
  answer:
    "هذه الخدمة مخصصة لمشاكل صيانة وبرمجة الهواتف والكمبيوتر فقط. " +
    "اطرح مشكلتك التقنية وسأساعدك فيها.",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    // حد أقصى للحجم: يمنع إغراق الخادم. رُفع إلى 10 ميجا ليتّسع للصوت
    // بترميز base64 (يكبّر الحجم ~33%)؛ 10 ميجا تكفي دقيقة تسجيل مضغوط.
    const LIMIT = 10 * 1024 * 1024;
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > LIMIT) {
        reject(new Error("too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * المنطق الخالص: يأخذ جسم الطلب المُحلَّل ويعيد { status, payload }.
 * يُستعمل من خادم http (handleAiRequest) ومن دالة Vercel (api/ai.js).
 */
async function runAi(body) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      payload: {
        error: "not_configured",
        message: "خدمة مشكلتي غير مفعّلة حاليًا. لم يُضبط مفتاح Gemini على الخادم.",
      },
    };
  }

  const problem = String((body && body.problem) || "").trim();
  const audio = body.audio; // { data: base64, mimeType } أو غير موجود
  // حتى 4 صور — نقصّ الزائد على الخادم لا نثق بحدّ العميل وحده.
  const images = Array.isArray(body.images) ? body.images.slice(0, 4) : [];

  // ── بناء أجزاء المحتوى: نص و/أو صوت و/أو صور ───────────────────
  // Gemini متعدد الوسائط: يقبل الصوت والصور مباشرة عبر inlineData. حصر
  // المجال في تعليمات النظام يطبَّق على الوسائط كما على النص.
  const parts = [];
  if (problem.length >= 5) {
    parts.push({ text: problem });
  }
  if (audio && typeof audio.data === "string" && audio.data.length > 0) {
    parts.push({
      inlineData: {
        mimeType: audio.mimeType || "audio/mp4",
        data: audio.data,
      },
    });
    parts.push({ text: "استمع للتسجيل الصوتي أعلاه وحلّل المشكلة الواردة فيه." });
  }
  let imageCount = 0;
  for (const img of images) {
    if (img && typeof img.data === "string" && img.data.length > 0) {
      parts.push({
        inlineData: { mimeType: img.mimeType || "image/jpeg", data: img.data },
      });
      imageCount++;
    }
  }
  if (imageCount > 0) {
    parts.push({ text: "افحص الصور المرفقة أعلاه لتشخيص المشكلة." });
  }

  if (parts.length === 0) {
    return {
      status: 400,
      payload: { error: "too_short", message: "اكتب مشكلتك أو سجّلها صوتيًا لأتمكن من مساعدتك." },
    };
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT(apiKey), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.3,
          // gemini-flash-latest صار نموذج "تفكير": يضيف أجزاء تفكير قبل الإجابة،
          // فيأتي JSON في جزء غير الأول (أو يُستهلك رصيد الإخراج في التفكير).
          // إطفاؤه يعيد ردًّا مباشرًا واحدًا ويسرّع الرد ويقلّل الاستهلاك.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(audio || imageCount > 0 ? 60_000 : 30_000),
    });

    if (response.status === 429) {
      return { status: 429, payload: { error: "quota", message: "تجاوزنا الحصة المجانية لهذا اليوم. جرّب لاحقًا أو تواصل مع الدعم." } };
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[ai] Gemini ${response.status}: ${detail.slice(0, 300)}`);
      return { status: 502, payload: { error: "upstream", message: "تعذّر الوصول للمساعد الذكي حاليًا. حاول مرة أخرى." } };
    }

    const data = await response.json();
    // نجمع نص كل الأجزاء (لا parts[0] فقط): نماذج التفكير قد تضع JSON في جزء
    // لاحق، وقد يُقسَّم الرد على أكثر من جزء. نتجاهل الأجزاء بلا نص.
    const allParts = data?.candidates?.[0]?.content?.parts || [];
    const text = allParts.map((p) => (p && p.text) || "").join("").trim();
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || "no_text";
      console.error(`[ai] no text (finishReason=${reason})`);
      return { status: 200, payload: OUT_OF_SCOPE_REPLY };
    }

    const parsed = JSON.parse(text);
    return { status: 200, payload: parsed.inScope === true ? parsed : OUT_OF_SCOPE_REPLY };
  } catch (e) {
    const timedOut = e.name === "TimeoutError" || e.name === "AbortError";
    console.error(`[ai] ${e.name}: ${e.message}`);
    return {
      status: timedOut ? 504 : 500,
      payload: {
        error: timedOut ? "timeout" : "internal",
        message: timedOut ? "استغرق الرد وقتًا طويلًا. حاول مرة أخرى." : "حدث خطأ غير متوقع. حاول مرة أخرى.",
      },
    };
  }
}

/** غلاف خادم http (Render/محلي): يقرأ الجسم ثم يمرّره لـ runAi. */
async function handleAiRequest(req, res) {
  if (req.method !== "POST") { send(res, 405, { error: "method_not_allowed" }); return true; }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (e) {
    send(res, 400, { error: "bad_request", message: e.message === "too_large" ? "التسجيل أو النص كبير جدًا." : "طلب غير صالح." });
    return true;
  }
  const { status, payload } = await runAi(body);
  send(res, status, payload);
  return true;
}

module.exports = { handleAiRequest, runAi };
