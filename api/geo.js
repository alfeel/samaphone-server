// GET /api/geo — بلد الطلب عبر IP (يوفّره Vercel مجانًا في ترويسة الطلب).
// يُرجع رمز الدولة ISO (مثل "YE") — العميل يحفظه في حسابه لعرض البلد
// حتى لحسابات البريد/جوجل التي بلا رقم جوال.
module.exports = async (req, res) => {
  const country =
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    "";
  res.setHeader("cache-control", "no-store");
  return res.status(200).json({ country: String(country).toUpperCase() });
};
