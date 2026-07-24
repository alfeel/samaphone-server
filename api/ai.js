// دالة Vercel — POST /api/ai. تعيد runAi على الجسم المُحلَّل تلقائيًا.
const { runAi } = require("../ai");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { status, payload } = await runAi(req.body || {});
  res.status(status).json(payload);
};
