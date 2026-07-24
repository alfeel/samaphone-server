// دالة Vercel — POST /api/otp/check. التحقق من الرمز.
const { runOtp } = require("../../otp");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { status, payload } = await runOtp("check", req.body || {});
  res.status(status).json(payload);
};
