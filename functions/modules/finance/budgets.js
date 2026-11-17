/* eslint-disable require-jsdoc */
function amount(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 1e9 ?
    value : null;
}

async function handleBudget(db, uid, req, res) {
  const {AggregateField} = require("firebase-admin/firestore");
  const month = req.method === "POST" ? req.body?.month : req.query.month;
  if (typeof month !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(422).json({error: "조회할 월을 확인해 주세요."});
  }
  const root = db.doc(`users/${uid}`);
  const ref = root.collection("budgets").doc(month);
  if (req.method === "POST") {
    const budget = amount(req.body?.budget);
    if (budget === null) {
      return res.status(422).json({error: "예산 금액을 확인해 주세요."});
    }
    if (req.body?.useAsDefault === true) {
      await root.set({profile: {monthly_budget_krw: budget}}, {merge: true});
      return res.json({month, budget, source: "onboarding"});
    }
    await ref.set({total_budget: budget}, {merge: true});
    return res.json({month, budget, source: "monthly"});
  }
  if (req.method !== "GET") {
    return res.status(405).json({error: "지원하지 않는 메서드입니다."});
  }
  const [saved, profile, totals] = await Promise.all([
    ref.get(), root.get(),
    root.collection("transactions").where("date", ">=", `${month}-01`)
        .where("date", "<=", `${month}-31\uf8ff`)
        .aggregate({spent: AggregateField.sum("amount")}).get(),
  ]);
  const monthly = amount(saved.get("total_budget") ?? saved.get("budget"));
  const initial = amount(profile.get("profile.monthly_budget_krw"));
  return res.json({month, budget: monthly ?? initial,
    source: monthly ? "monthly" : initial ? "onboarding" : null,
    spent: totals.data().spent ?? 0});
}

module.exports = {handleBudget};
