// レシート読み取りAPIサーバー
import express from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import {
  readReceipt,
  ReceiptReadError,
  SUPPORTED_MEDIA_TYPES,
} from "./receipt.js";

const PORT = process.env.PORT || 3001;

// Claude APIの画像上限は5MB（base64変換後）なので、変換前で約3.75MBまでにする
const MAX_FILE_SIZE = Math.floor((5 * 1024 * 1024 * 3) / 4);

// アップロードされた画像はディスクに保存せず、メモリ上で扱う
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const app = express();

// レシート画像を受け取り、読み取り結果を返す
app.post("/api/receipts/scan", upload.single("receipt"), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "APIキーが設定されていません。server/.env を確認してください。",
    });
  }
  if (!req.file) {
    return res.status(400).json({ error: "画像ファイルを選択してください。" });
  }
  if (!SUPPORTED_MEDIA_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: "JPEG・PNG・GIF・WebP形式の画像を選択してください。",
    });
  }

  try {
    const receipt = await readReceipt(req.file.buffer, req.file.mimetype);
    res.json(receipt);
  } catch (error) {
    console.error(error);

    if (error instanceof ReceiptReadError) {
      return res.status(422).json({ error: error.message });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({
        error: "APIキーが正しくありません。server/.env を確認してください。",
      });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({
        error: "混み合っています。しばらく待ってから再度お試しください。",
      });
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({
        error: "Claude APIでエラーが発生しました。時間をおいて再度お試しください。",
      });
    }
    res.status(500).json({ error: "サーバーでエラーが発生しました。" });
  }
});

// multerのエラー（ファイルサイズ超過など）をまとめて処理する
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "画像サイズが大きすぎます（上限 約3.7MB）。" });
  }
  console.error(error);
  res.status(500).json({ error: "サーバーでエラーが発生しました。" });
});

app.listen(PORT, () => {
  console.log(`サーバーを起動しました: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "注意: ANTHROPIC_API_KEY が設定されていません。server/.env に設定してください。",
    );
  }
});
