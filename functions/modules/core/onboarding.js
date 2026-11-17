/* eslint-disable require-jsdoc, max-len */
const tools = ["microwave", "stove", "rice_cooker", "air_fryer"];
const priorities = ["save_money", "reduce_waste", "build_routine"];
const inventoryStates = ["not_entered", "empty", "needs_registration"];

const optionalInt = (value, min, max) => value === null ||
  (Number.isSafeInteger(value) && value >= min && value <= max);

function validateOnboarding(body) {
  if (!body || !optionalInt(body.living_months, 0, 1200) ||
      !optionalInt(body.cooking_days_per_week, 0, 7) ||
      !optionalInt(body.monthly_budget_krw, 1, 1e9) ||
      (body.priority !== null && !priorities.includes(body.priority)) ||
      !inventoryStates.includes(body.initial_inventory_state) ||
      !Array.isArray(body.cooking_tools) ||
      body.cooking_tools.some((tool) => !tools.includes(tool)) ||
      new Set(body.cooking_tools).size !== body.cooking_tools.length) return null;
  return {
    living_months: body.living_months,
    cooking_days_per_week: body.cooking_days_per_week,
    monthly_budget_krw: body.monthly_budget_krw,
    priority: body.priority,
    initial_inventory_state: body.initial_inventory_state,
    cooking_tools: body.cooking_tools,
  };
}

async function handleOnboarding(db, uid, req, res) {
  const ref = db.doc(`users/${uid}`);
  if (req.method === "GET") {
    const snapshot = await ref.get();
    const profile = snapshot.get("profile");
    return res.json({profile: profile && typeof profile === "object" ? profile : null,
      completed: !!snapshot.get("onboardingCompletedAt")});
  }
  if (req.method !== "PUT") return res.status(405).json({error: "지원하지 않는 메서드입니다."});
  const profile = validateOnboarding(req.body);
  if (!profile) return res.status(422).json({error: "생활 설정의 예산, 횟수, 선택 항목을 확인해 주세요."});
  const {FieldValue} = require("firebase-admin/firestore");
  await ref.set({profile, onboardingCompletedAt: FieldValue.serverTimestamp()}, {merge: true});
  return res.json({profile, completed: true});
}

module.exports = {handleOnboarding};
