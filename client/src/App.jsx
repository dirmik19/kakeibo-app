// レシート読み込み家計簿アプリの画面全体
import { useEffect, useState } from "react";
import ReceiptUploader from "./components/ReceiptUploader.jsx";
import ItemList from "./components/ItemList.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import { useColorScheme } from "./useColorScheme.js";
import { findDuplicateReceipt, findNegativeItems } from "./validation.js";
import {
  formatMonth,
  formatYen,
  loadItems,
  saveItems,
  today,
  toMonth,
} from "./utils.js";

export default function App() {
  // 登録済みの商品一覧（起動時にローカルストレージから復元する）
  const [items, setItems] = useState(loadItems);
  const [selectedMonth, setSelectedMonth] = useState(() => toMonth(today()));
  const [notice, setNotice] = useState(null);
  // 重複の可能性があり、登録するか確認中のレシート
  const [pending, setPending] = useState(null);
  const scheme = useColorScheme();

  // 商品一覧が変わるたびにローカルストレージへ保存する
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // 月の選択肢：データがある月＋今月（新しい順）
  const months = [
    ...new Set([toMonth(today()), ...items.map((item) => toMonth(item.date))]),
  ].sort((a, b) => b.localeCompare(a));
  const latestMonth = months[0];

  const monthItems = items.filter(
    (item) => toMonth(item.date) === selectedMonth,
  );
  const monthTotal = monthItems.reduce((sum, item) => sum + item.price, 0);

  // 読み取り結果を検証し、問題がなければ一覧に追加する
  function handleScanned(receipt) {
    // 日付が読み取れなかった場合は今日の日付にする
    const scanned = {
      ...receipt,
      date: receipt.date ?? today(),
      dateMissing: receipt.date === null,
    };

    // 同じ日時・合計金額のレシートがあれば、登録する前に確認する
    const duplicate = findDuplicateReceipt(scanned, items);
    if (duplicate) {
      setNotice(null);
      setPending({ receipt: scanned, duplicate });
      return;
    }
    registerReceipt(scanned);
  }

  function registerReceipt(receipt) {
    const receiptId = crypto.randomUUID();
    const newItems = receipt.items.map((item) => ({
      id: crypto.randomUUID(),
      receiptId,
      date: receipt.date,
      time: receipt.time,
      storeName: receipt.storeName,
      name: item.name,
      price: item.price,
      category: item.category,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSelectedMonth(toMonth(receipt.date));
    setPending(null);

    const messages = [
      `${receipt.storeName ?? "レシート"}（${receipt.date}）から${newItems.length}件を登録しました。`,
    ];
    const warnings = [];
    if (receipt.dateMissing) {
      warnings.push("日付が読み取れなかったため、今日の日付で登録しています。");
    }
    // 金額が負の値の商品がある場合は確認を促す
    const negativeItems = findNegativeItems(newItems);
    if (negativeItems.length > 0) {
      const list = negativeItems
        .map((item) => `「${item.name}」${formatYen(item.price)}`)
        .join("、");
      warnings.push(
        `金額がマイナスの商品があります：${list}。値引きでない場合は読み取りミスの可能性があるため、明細を確認してください。`,
      );
    }
    // レシートの合計と読み取った金額の合計が違う場合は確認を促す
    const sum = newItems.reduce((total, item) => total + item.price, 0);
    if (receipt.total !== null && receipt.total !== sum) {
      warnings.push(
        `レシートの合計（${formatYen(receipt.total)}）と読み取った金額の合計（${formatYen(sum)}）が一致しません。内容を確認してください。`,
      );
    }

    setNotice({
      type: warnings.length > 0 ? "warning" : "success",
      messages: [...messages, ...warnings],
    });
  }

  function handleCancelPending() {
    setPending(null);
    setNotice({ type: "success", messages: ["登録を取り消しました。"] });
  }

  function handleChangeCategory(id, category) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category } : item)),
    );
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>レシート家計簿</h1>
        <p className="muted">
          レシートの写真から、商品と金額を自動で読み取って記録します。
        </p>
      </header>

      <ReceiptUploader onScanned={handleScanned} />
      {pending && (
        <div className="message warning" role="alert">
          <p>
            同じ日時（{pending.duplicate.date}
            {pending.duplicate.time && ` ${pending.duplicate.time}`}
            ）・同じ合計金額（{formatYen(pending.duplicate.total)}
            ）のレシート
            {pending.duplicate.storeName && `（${pending.duplicate.storeName}）`}
            が既に登録されています。二重登録の可能性があります。
          </p>
          <div className="message-actions">
            <button
              type="button"
              className="primary"
              onClick={() => registerReceipt(pending.receipt)}
            >
              それでも登録する
            </button>
            <button type="button" onClick={handleCancelPending}>
              登録しない
            </button>
          </div>
        </div>
      )}
      {notice && (
        <div className={`message ${notice.type}`} role="status">
          {notice.messages.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}

      <div className="month-bar">
        <label>
          表示する月
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </label>
        <p className="month-total">
          <span className="muted">{formatMonth(selectedMonth)}の支出</span>
          <strong>{formatYen(monthTotal)}</strong>
        </p>
      </div>

      <div className="chart-grid">
        <section className="card">
          <h2>カテゴリ別の支出（{formatMonth(selectedMonth)}）</h2>
          <CategoryChart items={monthItems} scheme={scheme} />
        </section>
        <section className="card">
          <h2>月別の支出</h2>
          <MonthlyChart
            items={items}
            scheme={scheme}
            selectedMonth={selectedMonth}
            latestMonth={latestMonth}
            onSelectMonth={setSelectedMonth}
          />
        </section>
      </div>

      <section className="card">
        <h2>明細（{formatMonth(selectedMonth)}）</h2>
        <ItemList
          items={monthItems}
          onChangeCategory={handleChangeCategory}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
