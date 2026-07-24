// نقطة تشخيص آمنة — تُظهر أي المفاتيح "موجودة" في بيئة التشغيل دون كشف قيمها.
// تُرجع true/false فقط + طول القيمة (للكشف عن قيمة فارغة أو بها مسافات).
module.exports = async (req, res) => {
  const g = process.env.GEMINI_API_KEY || "";
  res.status(200).json({
    hasGemini: g.length > 0,
    geminiLen: g.length,
    geminiPrefixOk: g.startsWith("AIza"),
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasTwilioVerify: !!process.env.TWILIO_VERIFY_SERVICE_SID,
    node: process.version,
    // أسماء متغيّرات البيئة التي تبدأ بـ GEMINI/TWILIO فقط (كشف أخطاء التسمية)
    keyNames: Object.keys(process.env).filter((k) => /GEMINI|TWILIO/i.test(k)),
  });
};
