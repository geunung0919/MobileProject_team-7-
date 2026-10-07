export function onboardingBody(form, profile) {
  return Object.fromEntries(form.steps.flatMap(step => step.fields).map(field => {
    const value = profile[field.name];
    if (field.widget !== 'integer') return [field.name, value ?? field.skip_value ?? null];
    if (value == null || value === '') return [field.name, null];
    if (!/^[0-9]+$/.test(String(value))) throw new Error(`${field.label}: 0 이상의 정수로 입력해 주세요.`);
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error(`${field.label}: 입력한 수가 너무 커요.`);
    return [field.name, number];
  }));
}
export function answerLabel(field, value) {
  if (value == null) return '나중에 입력';
  if (Array.isArray(value)) return value.length ? value.map(key => field.option_labels[key] || key).join(', ') : (field.empty_label || '없음');
  return field.option_labels[value] || String(value);
}
