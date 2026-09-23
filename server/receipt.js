// Claude APIを使ってレシート画像を読み取る処理
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// 使用するモデル（Claude Haikuの最新版）
export const MODEL = "claude-haiku-4-5";

// 分類カテゴリ（client/src/constants.js と同じ並びにしておくこと）
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

// Claude APIが受け付ける画像形式
export const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Claudeに返してもらうJSONの形（構造化出力で必ずこの形になる）
const ReceiptSchema = z.object({
  storeName: z
    .string()
    .nullable()
    .describe("店名。読み取れない場合はnull"),
  date: z
    .string()
    .nullable()
    .describe("購入日（YYYY-MM-DD形式）。読み取れない場合はnull"),
  time: z
    .string()
    .nullable()
    .describe("購入時刻（24時間表記のHH:MM形式）。読み取れない場合はnull"),
  items: z
    .array(
      z.object({
        name: z.string().describe("商品名"),
        price: z
          .number()
          .int()
          .describe("税込金額（円）。値引きはマイナスの値"),
        // z.enumはSDKの変換でAPIに制約として渡らないため、文字列で受けて後で補正する
        category: z
          .string()
          .describe(`商品のカテゴリ。次のいずれか: ${CATEGORIES.join("、")}`),
      }),
    )
    .describe("購入した商品の一覧"),
  total: z
    .number()
    .int()
    .nullable()
    .describe("レシートに記載された合計金額（円）。読み取れない場合はnull"),
});

const SYSTEM_PROMPT = `あなたは日本のレシートを読み取る家計簿アシスタントです。
画像のレシートから、店名・購入日時・商品ごとの名前と金額・合計金額を抽出してください。

ルール:
- 金額は円単位の整数で返してください。
- 値引き・割引の行は、マイナスの金額の項目として含めてください。
- 消費税が商品と別に記載されている（外税の）場合は、「消費税」という項目を1行追加し、カテゴリは「その他」にしてください。
- 小計・合計・お預かり・お釣り・ポイントの行は商品に含めないでください。
- 日付は西暦のYYYY-MM-DD形式に変換してください（例: 令和8年9月23日 → 2026-09-23）。
- カテゴリは次の基準で選んでください:
  - 食費: スーパーやコンビニで買う食材・飲み物・お菓子
  - 日用品: 洗剤・ティッシュ・文房具などの消耗品
  - 外食: 飲食店での食事、テイクアウト
  - 交通費: 電車・バス・タクシー・ガソリン・駐車場
  - 医療費: 薬・病院・ドラッグストアの医薬品
  - 衣服: 服・靴・バッグ
  - 娯楽: 本・ゲーム・映画・趣味の品
  - その他: 上記に当てはまらないもの
- 画像がレシートでない、または読み取れない場合は、itemsを空の配列にしてください。`;

// 画像の読み取りに失敗したことを表すエラー（利用者に見せてよいメッセージを持つ）
export class ReceiptReadError extends Error {}

/**
 * レシート画像を読み取り、商品の一覧を返す
 * @param {Buffer} imageBuffer 画像データ
 * @param {string} mediaType 画像のMIMEタイプ
 */
export async function readReceipt(imageBuffer, mediaType) {
  // APIキーは環境変数 ANTHROPIC_API_KEY（server/.env）から自動で読み込まれる
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBuffer.toString("base64"),
            },
          },
          { type: "text", text: "このレシートを読み取ってください。" },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ReceiptSchema),
    },
  });

  // 途中で止まった場合や安全上の理由で拒否された場合はエラーにする
  if (response.stop_reason === "refusal") {
    throw new ReceiptReadError("この画像は読み取れませんでした。");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ReceiptReadError(
      "レシートの項目が多すぎて読み取りきれませんでした。",
    );
  }

  const receipt = response.parsed_output;
  if (!receipt) {
    throw new ReceiptReadError("読み取り結果を解析できませんでした。");
  }

  // 日付・時刻の形式が正しくない場合は「不明」として扱う
  if (receipt.date && !/^\d{4}-\d{2}-\d{2}$/.test(receipt.date)) {
    receipt.date = null;
  }
  if (receipt.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(receipt.time)) {
    receipt.time = null;
  }

  // 一覧にないカテゴリが返ってきた場合は「その他」にする
  for (const item of receipt.items) {
    if (!CATEGORIES.includes(item.category)) {
      item.category = "その他";
    }
  }

  return receipt;
}
