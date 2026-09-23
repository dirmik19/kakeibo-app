// レシート読み込み家計簿アプリの画面全体
import { useEffect, useState } from "react";
import ReceiptUploader from "./components/ReceiptUploader.jsx";
import ItemList from "./components/ItemList.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import { useColorScheme } from "./useColorScheme.js";
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

  // 読み取り結果を一覧に追加する
  function handleScanned(receipt) {
    const receiptId = crypto.randomUUID();
    // 日付が読み取れなかった場合は今日の日付にする
    const date = receipt.date ?? today();
    const newItems = receipt.items.map((item) => ({
      id: crypto.randomUUID(),
      receiptId,
      date,
      storeName: receipt.storeName,
      name: item.name,
      price: item.price,
      category: item.category,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSelectedMonth(toMonth(date));

    // レシートの合計と読み取った金額の合計が違う場合は確認を促す
    const sum = newItems.reduce((total, item) => total + item.price, 0);
    const mismatch = receipt.total !== null && receipt.total !== sum;
    setNotice({
      type: mismatch ? "warning" : "success",
      text:
        `${receipt.storeName ?? "レシート"}（${date}）から${newItems.length}件を登録しました。` +
        (receipt.date ? "" : "日付が読み取れなかったため、今日の日付で登録しています。") +
        (mismatch
          ? `レシートの合計（${formatYen(receipt.total)}）と読み取った金額の合計（${formatYen(sum)}）が一致しません。内容を確認してください。`
          : ""),
    });
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
      {notice && (
        <p className={`message ${notice.type}`} role="status">
          {notice.text}
        </p>
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
