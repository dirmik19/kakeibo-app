// カテゴリ別の支出を円グラフと表で表示するコンポーネント
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { CATEGORIES, CHART_THEME, getCategoryColor } from "../constants.js";
import { formatYen } from "../utils.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryChart({ items, scheme }) {
  // カテゴリごとに金額を合計する（値引きだけのカテゴリなど0円以下は除く）
  const totals = CATEGORIES.map((category) => ({
    category,
    amount: items
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.price, 0),
  })).filter((row) => row.amount > 0);

  if (totals.length === 0) {
    return <p className="empty">この月のデータはまだありません。</p>;
  }

  const grandTotal = totals.reduce((sum, row) => sum + row.amount, 0);
  const theme = CHART_THEME[scheme];
  const percent = (amount) => Math.round((amount / grandTotal) * 100);

  const data = {
    labels: totals.map((row) => row.category),
    datasets: [
      {
        data: totals.map((row) => row.amount),
        // 色はカテゴリごとに固定（表示するカテゴリが変わっても色は変わらない）
        backgroundColor: totals.map((row) =>
          getCategoryColor(row.category, scheme),
        ),
        // 扇形どうしの間に背景色のすき間を入れて見分けやすくする
        borderColor: theme.surface,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: theme.text, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${formatYen(ctx.parsed)}（${percent(ctx.parsed)}%）`,
        },
      },
    },
  };

  return (
    <div className="category-chart">
      <div className="chart-box">
        <Pie data={data} options={options} aria-label="カテゴリ別支出の円グラフ" />
      </div>
      {/* グラフと同じ内容を表でも表示する（色だけに頼らず読めるように） */}
      <table className="summary-table">
        <tbody>
          {totals.map((row) => (
            <tr key={row.category}>
              <td>
                <span
                  className="swatch"
                  style={{ background: getCategoryColor(row.category, scheme) }}
                />
                {row.category}
              </td>
              <td className="num">{formatYen(row.amount)}</td>
              <td className="num muted">{percent(row.amount)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
