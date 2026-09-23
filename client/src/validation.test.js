// validation.js のテスト（実行: npm test --prefix client）
import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicateReceipt, findNegativeItems } from "./validation.js";

// 登録済みデータ：9/23 12:30 に合計300円のレシート
const existing = [
  { receiptId: "r1", date: "2026-09-23", time: "12:30", storeName: "A店", price: 100 },
  { receiptId: "r1", date: "2026-09-23", time: "12:30", storeName: "A店", price: 200 },
];

test("負の金額の商品だけを取り出す", () => {
  const items = [
    { name: "牛乳", price: 200 },
    { name: "値引き", price: -30 },
    { name: "無料", price: 0 },
  ];
  assert.deepEqual(findNegativeItems(items), [{ name: "値引き", price: -30 }]);
});

test("同じ日時・同じ合計金額なら重複と判定する", () => {
  const receipt = { date: "2026-09-23", time: "12:30", items: [{ price: 300 }] };
  assert.deepEqual(findDuplicateReceipt(receipt, existing), {
    date: "2026-09-23",
    time: "12:30",
    storeName: "A店",
    total: 300,
  });
});

test("合計金額が違えば重複ではない", () => {
  const receipt = { date: "2026-09-23", time: "12:30", items: [{ price: 301 }] };
  assert.equal(findDuplicateReceipt(receipt, existing), null);
});

test("日付が違えば重複ではない", () => {
  const receipt = { date: "2026-09-24", time: "12:30", items: [{ price: 300 }] };
  assert.equal(findDuplicateReceipt(receipt, existing), null);
});

test("時刻が違えば重複ではない", () => {
  const receipt = { date: "2026-09-23", time: "18:00", items: [{ price: 300 }] };
  assert.equal(findDuplicateReceipt(receipt, existing), null);
});

test("時刻が読み取れていない場合は日付と合計金額で判定する", () => {
  const receipt = { date: "2026-09-23", time: null, items: [{ price: 300 }] };
  assert.notEqual(findDuplicateReceipt(receipt, existing), null);
});

test("時刻を持たない古いデータとも日付と合計金額で判定する", () => {
  const old = existing.map(({ time, ...rest }) => rest);
  const receipt = { date: "2026-09-23", time: "12:30", items: [{ price: 300 }] };
  assert.deepEqual(findDuplicateReceipt(receipt, old)?.time, null);
});

test("登録済みデータがなければ重複ではない", () => {
  const receipt = { date: "2026-09-23", time: "12:30", items: [{ price: 300 }] };
  assert.equal(findDuplicateReceipt(receipt, []), null);
});
