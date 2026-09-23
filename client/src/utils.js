// 保存・日付・金額・画像に関する便利な関数

const STORAGE_KEY = "kakeibo-app:items:v1";

/** ローカルストレージから登録済みの商品一覧を読み込む */
export function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    // プライベートモードなどで読み込めない場合は空の一覧から始める
    return [];
  }
}

/** 商品一覧をローカルストレージに保存する */
export function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("ローカルストレージに保存できませんでした", error);
  }
}

/** 今日の日付を YYYY-MM-DD 形式で返す */
export function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** 日付（YYYY-MM-DD）から月（YYYY-MM）を取り出す */
export function toMonth(date) {
  return date.slice(0, 7);
}

/** 月（YYYY-MM）を「2026年9月」の形にする */
export function formatMonth(month) {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

/** 金額を「1,234円」の形にする */
export function formatYen(amount) {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/** 指定した月から数えて、過去n か月分の月（YYYY-MM）を古い順に返す */
export function recentMonths(endMonth, count) {
  const [year, month] = endMonth.split("-").map(Number);
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

// Claudeが画像を読むときの推奨サイズ（長辺のピクセル数）
const MAX_IMAGE_EDGE = 1568;

/**
 * 画像を縮小してJPEGに変換する
 * スマホの写真はサイズが大きいため、送信前に小さくして通信量とAPI料金を抑える
 */
export async function resizeImage(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "この画像は読み込めませんでした。JPEG・PNG形式の画像を選択してください。",
    );
  }

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。")),
      "image/jpeg",
      0.85,
    );
  });
}
