// POST /api/email/verify — يتحقق من رمز البريد.
// يفكّ token المشفّر ويقارن الرمز والبريد والصلاحية. بلا حالة على الخادم.
const crypto = require("crypto");

function keyBuf() {
  return crypto.createHash("sha256").update(process.env.RESEND_API_KEY || "").digest();
}
function dec(token) {
  const b = Buffer.from(String(token), "base64url");
  const iv = b.subarray(0, 12), tag = b.subarray(12, 28), ct = b.subarray(28);
  const d = crypto.createDecipheriv("aes-256-gcm", keyBuf(), iv);
  d.setAuthTag(tag);
  const pt = Buffer.concat([d.update(ct), d.final()]).toString("utf8");
  return JSON.parse(pt);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "not_configured" });

  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  let payload;
  try {
    payload = dec(body.token);
  } catch (e) {
    return res.status(400).json({ error: "bad_token", message: "رمز غير صالح. اطلب رمزًا جديدًا." });
  }
  if (Date.now() > Number(payload.exp)) return res.status(400).json({ error: "expired", message: "انتهت صلاحية الرمز. اطلب رمزًا جديدًا." });
  if (payload.email !== email) return res.status(400).json({ error: "mismatch", message: "بريد غير مطابق." });
  if (String(payload.code) !== code) return res.status(400).json({ error: "bad_code", message: "الرمز غير صحيح." });

  return res.status(200).json({ verified: true, email });
};
