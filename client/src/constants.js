// アプリ全体で使う定数

// 分類カテゴリ（server/receipt.js と同じ並びにしておくこと）
export const CATEGORIES = [
  "食費",
  "日用品",
  "外食",
  "交通費",
  "医療費",
  "衣服",
  "娯楽",
  "その他",
];

// カテゴリごとのグラフの色（色覚多様性に配慮して検証済みの並び）
// 並び順が見分けやすさを保つ仕組みなので、順番を入れ替えないこと
export const CATEGORY_COLORS = {
  light: [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
    "#4a3aa7",
    "#e34948",
  ],
  dark: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
    "#e66767",
  ],
};

// グラフの文字・目盛り線・背景の色
export const CHART_THEME = {
  light: {
    surface: "#ffffff",
    text: "#52514e",
    grid: "#e8e7e3",
    bar: "#2a78d6",
    barSelected: "#184f95",
  },
  dark: {
    surface: "#1f1f1e",
    text: "#c3c2b7",
    grid: "#383835",
    bar: "#3987e5",
    barSelected: "#86b6ef",
  },
};

/** カテゴリ名から色を取得する（カテゴリごとに色は固定） */
export function getCategoryColor(category, scheme) {
  const index = CATEGORIES.indexOf(category);
  const colors = CATEGORY_COLORS[scheme];
  return colors[index === -1 ? colors.length - 1 : index];
}
