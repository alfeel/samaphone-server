/**
 * وسيط تحقق OTP عبر Twilio Verify.
 *
 * ── لماذا Twilio Verify لا رمز يدوي؟ ───────────────────────────
 * Verify تولّد الرمز وترسله (SMS/واتساب) وتتحقق منه على خوادم Twilio،
 * فلا نخزّن رموزًا ولا ننشئ منطق انتهاء صلاحية. نحن مجرد وسيط يحمل
 * المفاتيح السرّية (لا تصل الجهاز أبدًا).
 *
 * ── التشغيل (متغيّرات بيئة على الخادم) ─────────────────────────
 *   TWILIO_ACCOUNT_SID=AC...
 *   TWILIO_AUTH_TOKEN=...            (سرّ — على الخادم فقط)
 *   TWILIO_VERIFY_SERVICE_SID=VA...  (من Twilio Console ← Verify ← Services)
 *
 * المسارات:
 *   POST /api/otp/send   { phone, channel? }  → يرسل الرمز
 *   POST /api/otp/check  { phone, code }       → يتحقق
 */

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    const LIMIT = 64 * 1024;
    req.on("data", (c) => {
      raw += c;
      if (raw.length > LIMIT) { reject(new Error("too_large")); req.destroy(); }
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

/** E.164: يفترض رمز اليمن +967 لو أُرسل الرقم محليًا. */
function toE164(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (String(phone).trim().startsWith("+")) return "+" + digits;
  if (digits.startsWith("967")) return "+" + digits;
  return "+967" + digits.replace(/^0+/, "");
}

async function twilio(path, params) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) {
    const err = new Error("not_configured");
    err.notConfigured = true;
    throw err;
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${service}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    },
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** يعالج POST /api/otp/send و /api/otp/check. */
async function handleOtpRequest(req, res, pathname) {
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: "bad_request", message: "طلب غير صالح." });
  }

  const phone = toE164(body.phone);
  if (!phone) return send(res, 400, { error: "no_phone", message: "رقم الجوال مطلوب." });

  try {
    if (pathname === "/api/otp/send") {
      // القناة: sms افتراضيًا، أو whatsapp إن طُلبت وكانت مفعّلة في Twilio.
      const channel = body.channel === "whatsapp" ? "whatsapp" : "sms";
      const { ok, data } = await twilio("Verifications", { To: phone, Channel: channel });
      if (!ok) return send(res, 502, { error: "send_failed", message: "تعذّر إرسال الرمز." });
      return send(res, 200, { sent: true, channel, to: phone });
    }

    if (pathname === "/api/otp/check") {
      const code = String(body.code || "").trim();
      if (!code) return send(res, 400, { error: "no_code", message: "أدخل الرمز." });
      const { ok, data } = await twilio("VerificationCheck", { To: phone, Code: code });
      const approved = ok && data.status === "approved";
      return send(res, 200, { approved });
    }

    return send(res, 404, { error: "not_found" });
  } catch (e) {
    if (e.notConfigured) {
      return send(res, 503, {
        error: "not_configured",
        message: "خدمة التحقق غير مفعّلة. لم تُضبط مفاتيح Twilio على الخادم.",
      });
    }
    return send(res, 500, { error: "internal", message: "حدث خطأ. حاول مجددًا." });
  }
}

module.exports = { handleOtpRequest };
