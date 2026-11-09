// Only numbered rows with a consistent unit price, quantity, and line total.
const rowPattern = /^\d{1,3}[*.)]?\s+(.+?)\s+([\d,]+)\s+(\d{1,3})\s+([\d,]+)\s*원?$/;
const plainIngredients = /^(?:(?:국산콩)?(?:두부|순두부|연두부)|달걀|계란|딸기|산딸기|사과|바나나|양파|대파|감자|고구마|당근|오이|양배추|콩나물|시금치|애호박|새송이버섯|표고버섯|돼지고기|소고기|닭가슴살)$/;
const plainMilk = /^(?:서울우유|매일우유|남양우유|파스퇴르우유|흰우유|일반우유|저지방우유|무지방우유|우유)$/;
const packageSuffix = /(?:\d+(?:\.\d+)?(?:kg|g|ml|l|구|개|입)(?:[x×*]\d+)?(?:\/(?:박스|팩|봉|망|병))?|\/(?:박스|팩|봉|망|병))$/i;

function isIngredient(name) {
  // Remove only an explicitly recognized package suffix; match the entire name.
  // Never remove flavor or product words such as 주스, 맛, 칩, or 음료.
  const compact = name.replace(/\s+/g, '');
  const base = compact.replace(packageSuffix, '');
  return plainIngredients.test(base) || plainMilk.test(base);
}

export function receiptIngredients(rawText) {
  const items = [];
  const seenRows = new Set();
  for (const raw of rawText.normalize('NFKC').split(/\r?\n/)) {
    const line = raw.trim();
    const match = rowPattern.exec(line);
    if (!match || seenRows.has(line)) continue;
    const [, name, price, count, total] = match;
    const quantity = Number(count);
    const unitPrice = Number(price.replaceAll(',', ''));
    const lineTotal = Number(total.replaceAll(',', ''));
    if (!isIngredient(name) || quantity < 1 || unitPrice <= 0 ||
        !Number.isSafeInteger(lineTotal) || unitPrice * quantity !== lineTotal) continue;
    seenRows.add(line);
    items.push({ name, quantity, unit: '개', dateType: 'unknown', expiresAt: '' });
    if (items.length === 30) break;
  }
  return items;
}
