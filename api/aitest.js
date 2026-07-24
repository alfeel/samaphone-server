// فحص مؤقت — يستدعي runAi المنشورة فعليًا ويعيد مخرجها، لتحديد ما إذا كان
// الخلل في runAi أم في غلاف /api/ai. يُحذف بعد التشخيص.
const { runAi } = require("../ai");
module.exports = async (req, res) => {
  try {
    const out = await runAi({ problem: "شاشة هاتفي مكسورة وأريد استبدالها" });
    res.status(200).json({ ranRunAi: true, out });
  } catch (e) {
    res.status(200).json({ error: e.name + ": " + e.message, stack: (e.stack || "").slice(0, 400) });
  }
};
