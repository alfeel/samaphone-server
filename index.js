/**
 * نقطة تشغيل الخادم على الاستضافة (Render وغيرها).
 *
 * يعرّض واجهات API فقط (لا يخدم بناء الويب الثابت مثل serve.js):
 *   GET  /            → فحص صحة بسيط
 *   GET  /health      → فحص صحة
 *   POST /api/ai      → وسيط «مشكلتي» (يحمل مفتاح Gemini من متغيّر البيئة)
 *   POST /api/otp/... → تحقق Twilio (يُضاف عند تجهيز مفاتيح Twilio)
 *
 * بلا اعتماديات خارجية — Node مبنيّ (http) + fetch العام (Node 18+).
 * يستمع على process.env.PORT كما تشترط منصّات الاستضافة.
 */
const http = require("http");

const { handleAiRequest } = require("./ai");

// وسيط OTP اختياري — يُحمَّل فقط إن وُجد الملف ومفاتيح Twilio مضبوطة.
let handleOtpRequest = null;
try {
  ({ handleOtpRequest } = require("./otp"));
} catch {
  // otp.js غير موجود بعد — لا بأس، يُضاف عند تفعيل Twilio.
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/health") {
    send(res, 200, { ok: true, service: "samaphone-server" });
    return;
  }

  if (pathname === "/api/ai") {
    handleAiRequest(req, res).catch((e) => {
      console.error("[ai] unhandled", e);
      if (!res.headersSent) send(res, 500, { error: "internal" });
    });
    return;
  }

  if (pathname.startsWith("/api/otp/") && handleOtpRequest) {
    handleOtpRequest(req, res, pathname).catch((e) => {
      console.error("[otp] unhandled", e);
      if (!res.headersSent) send(res, 500, { error: "internal" });
    });
    return;
  }

  send(res, 404, { error: "not_found" });
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`samaphone-server listening on ${port}`);
});
