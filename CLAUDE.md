# kakeibo-app

## プロジェクト概要

レシート読み込み家計簿Webアプリ。レシート画像をClaude APIで読み取り、商品名・金額・日付をカテゴリ別に集計してグラフ表示する。

## 技術スタック

- フロントエンド: React（Vite）、Chart.js（react-chartjs-2）
- バックエンド: Node.js（Express、multer）
- AI: Claude API（`@anthropic-ai/sdk`、モデルは `claude-haiku-4-5`）
- データ保存: ブラウザのローカルストレージ（キー `kakeibo-app:items:v1`）

## ディレクトリ構成

```
kakeibo-app/
├── package.json          # server と client をまとめて起動するスクリプト
├── server/               # バックエンド（ポート3001）
│   ├── index.js          # Expressサーバー、POST /api/receipts/scan
│   ├── receipt.js        # Claude APIでのレシート読み取り、カテゴリ定義
│   └── .env.example      # 環境変数のひな形（.env はコミットしない）
└── client/               # フロントエンド（ポート5173、/api は server へプロキシ）
    └── src/
        ├── App.jsx       # 画面全体・状態管理
        ├── constants.js  # カテゴリ・グラフの色
        ├── utils.js      # 保存・日付・金額・画像縮小の関数
        ├── validation.js # 負の金額・重複レシートの検証（テストは validation.test.js）
        └── components/   # アップロード・明細・円グラフ・棒グラフ
```

## よく使うコマンド

- 初回セットアップ: `npm run install:all`（その後 `server/.env.example` を `server/.env` にコピーしてAPIキーを設定）
- 開発サーバー起動: `npm run dev`（server と client を同時に起動）
- テスト: `npm test`（`client/src/**/*.test.js` を Node.js 標準のテストランナーで実行）
- フロントエンドのビルド: `npm run build`

## 実装上の決まりごと

- Claude APIのキーはバックエンドだけで扱う。ブラウザ側のコードにAPIキーを置かない。
- カテゴリの一覧は `server/receipt.js` と `client/src/constants.js` の両方にあるため、変更するときは両方をそろえる。
- グラフのカテゴリ色は色覚多様性に配慮して検証済みの並びなので、順番を入れ替えない。

## コミュニケーション

- 返答・説明は必ず日本語で行うこと。
- コード内のコメントも原則として日本語で記述する。

## Git運用ルール

- **コードを変更するたびに、コミットしてGitHubにプッシュすること。**
  - 1つの変更（機能追加・修正など）が完了したら、その都度 `git add` → `git commit` → `git push` を行う。
  - 変更をローカルに溜め込まない。
- コミットメッセージは日本語で、変更内容が分かるように簡潔に書く。
  - 例: `支出入力フォームを追加`、`合計金額の計算ミスを修正`
- プッシュ前に、動作確認やテストが通ることを確認する。
- 認証情報・APIキー・`.env` などの機密情報はコミットしない（`.gitignore` で除外する）。
