// دالة Vercel — POST /api/otp/send. إرسال رمز التحقق.
const { runOtp } = require("../../otp");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { status, payload } = await runOtp("send", req.body || {});
  res.status(status).json(payload);
};
