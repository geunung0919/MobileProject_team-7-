// Only numbered rows with a consistent unit price, quantity, and line total.
const rowPattern = /^\d{1,3}[*.)]?\s+(.+?)\s+([\d,]+)\s+(\d{1,3})\s+([\d,]+)\s*원?$/;
const ingredientPattern = /^(?:국산콩\s*)?(두부|달걀|계란|우유|딸기|사과|바나나|양파|대파|감자|당근|오이|양배추|콩나물|시금치|애호박|새송이버섯)(?:\s*\d+(?:\.\d+)?\s*(?:kg|g|ml|l|구|개|입))?(?:\s*\/\s*(?:박스|팩))?$/i;

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
    if (!ingredientPattern.test(name) || quantity < 1 || unitPrice <= 0 ||
        !Number.isSafeInteger(lineTotal) || unitPrice * quantity !== lineTotal) continue;
    seenRows.add(line);
    items.push({ name, quantity, unit: '개', dateType: 'unknown', expiresAt: '' });
    if (items.length === 30) break;
  }
  return items;
}
