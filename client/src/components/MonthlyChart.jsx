// 月別の支出合計を棒グラフで表示するコンポーネント
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART_THEME } from "../constants.js";
import { formatMonth, formatYen, recentMonths, toMonth } from "../utils.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// 表示する月数
const MONTH_COUNT = 12;

export default function MonthlyChart({
  items,
  scheme,
  selectedMonth,
  latestMonth,
  onSelectMonth,
}) {
  const months = recentMonths(latestMonth, MONTH_COUNT);
  const totals = months.map((month) =>
    items
      .filter((item) => toMonth(item.date) === month)
      .reduce((sum, item) => sum + item.price, 0),
  );
  const theme = CHART_THEME[scheme];

  const data = {
    labels: months.map((month) => `${Number(month.slice(5))}月`),
    datasets: [
      {
        label: "支出合計",
        data: totals,
        // 選択中の月だけ濃い色にする
        backgroundColor: months.map((month) =>
          month === selectedMonth ? theme.barSelected : theme.bar,
        ),
        borderRadius: 4,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    // 棒をクリックするとその月を選択する
    onClick: (_event, elements) => {
      if (elements.length > 0) onSelectMonth(months[elements[0].index]);
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length ? "pointer" : "default";
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.text },
      },
      y: {
        beginAtZero: true,
        grid: { color: theme.grid },
        border: { display: false },
        ticks: {
          color: theme.text,
          callback: (value) => formatYen(value),
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => formatMonth(months[ctx[0].dataIndex]),
          label: (ctx) => ` ${formatYen(ctx.parsed.y)}`,
        },
      },
    },
  };

  return (
    <div className="chart-box">
      <Bar data={data} options={options} aria-label="月別支出の棒グラフ" />
    </div>
  );
}
