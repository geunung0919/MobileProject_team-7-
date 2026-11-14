# AI 레시피 API (임시 형식) — 양민혁 님 확인 요청

설계 문서 p.22~23 흐름 기준. **AI는 레시피만 만들고, 재고 차감·레시피 저장은 하지 않습니다.**

## 호출
```js
const res = await httpsCallable(functions, "recommendRecipes")({
  max_minutes: 20,      // 선택, 5~120, 기본 30
  servings: 1,          // 선택, 1~4, 기본 1
  count: 2,             // 선택, 1~3, 기본 2
  must_use: ["두부"],   // 선택, '이 재료로 추천' (재료 이름)
});
```
로그인 필수(user_id는 서버가 인증 정보에서 결정). 하루 10회 제한.

## 응답
```json
{
  "recipes": [{
    "id": "rcp-1", "title": "두부 애호박 된장찌개", "minutes": 15, "difficulty": "보통",
    "icon": "silverware-fork-knife", "servings": 1,
    "tools": ["microwave"], "tool_labels": ["전자레인지"],
    "ingredients": [
      { "name": "두부", "from_inventory": true, "missing": false, "inventory_id": "f-tofu", "quantity": 1, "unit": "모", "amount_text": "1모" },
      { "name": "된장", "from_inventory": false, "missing": false, "inventory_id": null, "quantity": null, "unit": null, "amount_text": "1큰술" },
      { "name": "애호박", "from_inventory": false, "missing": true, "inventory_id": null, "quantity": null, "unit": null, "amount_text": "1/3개" }
    ],
    "steps": ["재료를 썰어요.", "끓여요."],
    "uses_expiring": ["두부"]
  }],
  "reason": null,
  "excluded_expired": ["우유"],
  "must_use_missing": []
}
```
- 재료 구분: `from_inventory: true` = 냉장고 재료 · `missing: true` = 냉장고에 없는 재료(앱의 **'필요한 재료'**, 레시피당 최대 2개) · 둘 다 false = 기본 양념(소금·간장 등)
- `difficulty`: 아주 쉬움 / 쉬움 / 보통 · `icon`: 앱의 MaterialCommunityIcons 이름
- `reason`: `null`(성공) · `no_inventory` · `must_use_not_found` · `limited` · `failed` — 실패면 `recipes: []`와 `message`(화면 표시용 문구)
- `excluded_expired`: 소비기한이 지나 추천에서 뺀 재료 → "소비기한 지난 재료는 제외했어요" 안내용
- 레시피는 저장하지 않으므로 `id`는 이번 응답 안에서만 의미가 있어요 (상세 화면에는 레시피 객체를 통째로 넘기세요)

## 요리 후 차감 (3모듈 담당)
`from_inventory: true`인 재료의 `inventory_id`, `quantity`를 **추천 사용량**으로 보여주고,
사용자가 확인·수정한 값만 INVENTORY에서 차감 → INVENTORY_USAGE_LOG(`source: "요리"`) 저장.

## 서버가 막는 것 (AI 출력을 그대로 믿지 않음)
냉장고에 없는 재료 3개 이상 · 보유 수량 초과 · 소비기한 지난 재료 · 사용자에게 없는 조리도구 · 조리시간 초과 · 냉장고 재료 없이 양념만 쓰는 레시피

## 확인 부탁드리는 것
1. INVENTORY에 `unit`(단위) 필드를 둘지, 이름은 뭘로 할지
2. `quantity`를 모를 때 null로 저장해도 되는지
3. 소비기한 '임박' 기준 (지금 D-3 이내로 가정)
4. 조리도구 코드 값 (지금 microwave, stove, rice_cooker, air_fryer, oven, kettle, pan, pot 가정 — 온보딩 담당 이현동 님과도 확인)
