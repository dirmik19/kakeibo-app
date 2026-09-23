// 読み取った商品の一覧を表示するコンポーネント
import { CATEGORIES } from "../constants.js";
import { formatYen } from "../utils.js";

export default function ItemList({ items, onChangeCategory, onDelete }) {
  if (items.length === 0) {
    return <p className="empty">この月のデータはまだありません。</p>;
  }

  // 新しい日付が上に来るように並べる
  const sorted = [...items].sort((a, b) =>
    `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`),
  );
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="table-wrap">
      <table className="item-table">
        <thead>
          <tr>
            <th>日付</th>
            <th>店名</th>
            <th>商品名</th>
            <th>カテゴリ</th>
            <th className="num">金額</th>
            <th>
              <span className="visually-hidden">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id}>
              <td className="nowrap">
                {item.date}
                {item.time && <span className="muted"> {item.time}</span>}
              </td>
              <td>{item.storeName ?? "—"}</td>
              <td>{item.name}</td>
              <td>
                {/* 自動分類が間違っていた場合はここで修正できる */}
                <select
                  value={item.category}
                  onChange={(e) => onChangeCategory(item.id, e.target.value)}
                  aria-label={`${item.name}のカテゴリ`}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </td>
              {/* マイナスの金額は読み取りミスの可能性があるので目立たせる */}
              {item.price < 0 ? (
                <td className="num nowrap negative" title="金額がマイナスです">
                  <span aria-hidden="true">⚠ </span>
                  {formatYen(item.price)}
                </td>
              ) : (
                <td className="num nowrap">{formatYen(item.price)}</td>
              )}
              <td>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`${item.name}を削除`}
                  title="削除"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>合計</td>
            <td className="num nowrap">{formatYen(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
