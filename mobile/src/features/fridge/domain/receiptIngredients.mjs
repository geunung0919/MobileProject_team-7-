const money = '(?:[0-9]{1,3}(?:[,.][0-9]{3})+|[0-9]+)';
const columns = new RegExp('^(.+?)\\s+(' + money + ')\\s+(\\d{1,3})\\s+(' + money + ')\\s*원?$');
const numberedName = /^\(?\d{1,3}\)?[*.)]?\s+(.+)$/;
const barcode = /^\d{8,14}$/;
const plainIngredients = /^(?:(?:국산콩)?(?:두부|순두부|연두부)|(?:반숙|구운)?(?:달걀|계란)|딸기|산딸기|사과|바나나|양파|대파|감자|고구마|당근|오이|(?:오이맛|오이|청양|풋)?고추|아스파라거스|버섯|한우안심|(?:그릴드)?닭가슴살|양배추|콩나물|시금치|애호박|새송이버섯|표고버섯|돼지고기|소고기|(?:국내산)?삼겹살(?:구이용)?|(?:동물복지)?닭다리살|닭가슴살)$/;
const plainMilk = /^(?:서울우유|매일우유|남양우유|파스퇴르우유|흰우유|일반우유|저지방우유|무지방우유|우유)$/;
const packageSuffix = /(?:\d+(?:\.\d+)?(?:kg|k|g|ml|l|구|개|입|망|팩|봉)(?:[x×*]\d+)?(?:\/(?:박스|팩|봉|망|병))?|\/(?:박스|팩|봉|망|병))$/i;

function isIngredient(name) {
  // Remove only an explicitly recognized package suffix; match the entire name.
  // Never remove flavor or product words such as 주스, 맛, 칩, or 음료.
  const compact = name.replace(/^[★☆*]+\s*/, '').replace(/\s+/g, '').replace(/\((?:팩|봉|박스|망)\)$/, '');
  const base = compact.replace(packageSuffix, '');
  return plainIngredients.test(base) || plainMilk.test(base);
}

export function receiptIngredients(rawText) {
  const items = [];
  const seenRows = new Set();
  let pendingName = '';
  for (const raw of rawText.normalize('NFKC').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const prior = pendingName;
    pendingName = '';
    const match = columns.exec(line);
    if (!match) {
      const possible = numberedName.exec(line)?.[1] ?? line.replace(/^[+*]\s*/, '');
      if (isIngredient(possible)) pendingName = possible;
      continue;
    }
    const [, label, price, count, total] = match;
    const name = barcode.test(label) ? prior : (numberedName.exec(label)?.[1] ?? label).replace(/^[+*]\s*/, '');
    const key = barcode.test(label) ? name + '\n' + line : line;
    if (!name || seenRows.has(key) || !isIngredient(name)) continue;
    const quantity = Number(count);
    const unitPrice = Number(price.replace(/[,.]/g, ''));
    const lineTotal = Number(total.replace(/[,.]/g, ''));
    if (quantity < 1 || unitPrice <= 0 || !Number.isSafeInteger(lineTotal) ||
        unitPrice * quantity !== lineTotal) continue;
    seenRows.add(key);
    items.push({ name, quantity, unit: '개', dateType: 'unknown', expiresAt: '' });
    if (items.length === 30) break;
  }
  return items;
}
