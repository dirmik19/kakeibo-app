// 読み取ったレシートデータの検証ロジック

/** 金額が負の値の商品を取り出す */
export function findNegativeItems(items) {
  return items.filter((item) => item.price < 0);
}

/** 商品の金額を合計する */
function sumPrices(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * 同じ日時・同じ合計金額のレシートが登録済みかどうかを調べる
 * @param {{date: string, time: string|null, items: {price: number}[]}} receipt 新しく読み取ったレシート
 * @param {object[]} existingItems 登録済みの商品一覧
 * @returns {{date: string, time: string|null, storeName: string|null, total: number}|null}
 *   重複しているレシートの情報（なければnull）
 */
export function findDuplicateReceipt(receipt, existingItems) {
  const newTotal = sumPrices(receipt.items);

  // 登録済みの商品をレシートごとにまとめる
  const receipts = new Map();
  for (const item of existingItems) {
    const group = receipts.get(item.receiptId) ?? [];
    group.push(item);
    receipts.set(item.receiptId, group);
  }

  for (const group of receipts.values()) {
    const { date, time, storeName } = group[0];
    if (date !== receipt.date) continue;
    // 時刻はどちらも読み取れているときだけ比べる（片方が不明なら日付だけで判定）
    if (time && receipt.time && time !== receipt.time) continue;

    const total = sumPrices(group);
    if (total === newTotal) {
      return { date, time: time ?? null, storeName, total };
    }
  }
  return null;
}
