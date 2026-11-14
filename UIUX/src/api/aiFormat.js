// 서버 응답 ↔ 화면 데이터 형식 변환 (Firebase 와 무관한 순수 함수라 따로 둡니다)

// 채팅 화면 메시지 [{ id, from: 'user'|'ai', text }] → 서버 history [{ role, content }] (첫 인사말 제외, 최근 6개)
export function toChatHistory(messages) {
  return messages
    .filter((m) => m.id !== 'greeting' && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
    .slice(-6);
}

// 서버 레시피 → 화면(data/fridge/recipes.js)과 같은 형식. ingredients[].name/amount 는 화면이 그대로 씁니다.
export function toUiRecipe(r) {
  return {
    id: r.id,
    title: r.title,
    minutes: r.minutes,
    difficulty: r.difficulty,
    servings: r.servings,
    icon: r.icon,
    steps: r.steps,
    usesExpiring: r.uses_expiring ?? [],
    ingredients: (r.ingredients ?? []).map((i) => ({
      name: i.name,
      amount: i.amount_text,
      // 요리 후 차감에 쓸 정보 (냉장고 재료만): inventoryId = 냉장고 식재료 id, quantity = 추천 사용량
      inventoryId: i.inventory_id ?? null,
      quantity: i.quantity ?? null,
      kind: i.from_inventory ? 'fridge' : i.missing ? 'missing' : 'pantry',
    })),
  };
}

// 레시피 실패 사유 → 화면 문구 (서버 message 가 있으면 그걸 우선)
export function recipeErrorText(res) {
  if (!res) return '레시피를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
  return res.message ?? '아직 만들 수 있는 요리가 없어요.';
}

// 비상매뉴얼 서버 응답 → AI 비상 매뉴얼 화면 메시지 { text, call, steps, detail }
// - 글은 서버 답변(검증된 FAQ 근거)을 그대로 쓰고, 전화 버튼·'자세히 보기'는 화면의 상황 안내(emergencyGuides)에서 가져옵니다.
// - 서버가 쓴 FAQ id 가 화면의 상황 id(fire, leak …)와 같으면 그 상황으로, 아니면 질문 키워드로 찾은 상황(local)으로 연결합니다.
// - 단계(steps)는 서버 답변 글에 이미 들어 있으므로 비워서 같은 내용이 두 번 보이지 않게 합니다.
export function toEmergencyMessage(res, local, situations, guides) {
  const id = res.faq_ids?.[0];
  const situation = situations.find((s) => s.id === id) ?? (local.detail ? situations.find((s) => s.id === local.detail.id) : null);
  const guide = situation ? guides[situation.id] : null;
  return {
    text: res.reply,
    call: guide?.call ?? (res.safety ? { number: '119', label: '화재·구조·구급' } : local.call ?? null),
    steps: [],
    detail: situation ? { id: situation.id, title: situation.title, tone: situation.tone } : null,
  };
}
