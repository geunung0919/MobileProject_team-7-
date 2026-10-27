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

// 서버가 내려준 입력 스키마에서 현재 화면의 범위를 읽는다. 최종 검증은 서버가 수행한다.
export function stepErrors(form, profile, stepIndex) {
  const errors = {};
  for (const field of form.steps[stepIndex].fields) {
    const value = profile[field.name];
    if (value == null || value === '') continue;
    const property = form.input_schema?.properties?.[field.name] || {};
    const schema = property.anyOf?.find(item => item.type !== 'null') || property;
    if (field.widget === 'integer') {
      if (!/^[0-9]+$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
        errors[field.name] = '0 이상의 정수로 입력해 주세요.';
      } else if ((schema.minimum != null && Number(value) < schema.minimum) ||
                 (schema.maximum != null && Number(value) > schema.maximum)) {
        errors[field.name] = `${schema.minimum ?? 0}~${schema.maximum ?? '허용 범위'} 사이로 입력해 주세요.`;
      }
    } else if (field.widget === 'single_select' && !Object.hasOwn(field.option_labels || {}, value)) {
      errors[field.name] = '목록에서 항목을 다시 선택해 주세요.';
    } else if (field.widget === 'multi_select' && (!Array.isArray(value) ||
               new Set(value).size !== value.length ||
               value.some(key => !Object.hasOwn(field.option_labels || {}, key)))) {
      errors[field.name] = '조리 도구를 목록에서 중복 없이 선택해 주세요.';
    } else if (field.widget === 'region_search' && schema.pattern && !new RegExp(schema.pattern).test(String(value))) {
      errors[field.name] = '법정동 코드 10자리 숫자를 입력하거나 비워 두세요.';
    }
  }
  return errors;
}


export function formErrors(form, profile) {
  return Object.assign({}, ...form.steps.map((_, index) => stepErrors(form, profile, index)));
}

export function serverFieldErrors(form, error) {
  const names = new Set(form.steps.flatMap(step => step.fields.map(field => field.name)));
  const errors = {};
  for (const detail of error.details || []) {
    const name = String(detail.field).split('.').find(part => names.has(part));
    if (name && !errors[name]) errors[name] = detail.message;
  }
  return errors;
}

export function firstErrorStep(form, errors) {
  return form.steps.findIndex(step => step.fields.some(field => Object.hasOwn(errors, field.name)));
}

// Keep navigation restricted to implemented screens, regardless of server target strings.
export function onboardingActionTarget(action) {
  const routes = { '/spending': '/spending', '/inventory': '/fridge/inventory' };
  return Object.hasOwn(routes, action.target) ? routes[action.target] : null;
}
