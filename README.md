# kakeibo-app（レシート家計簿）

レシートの写真をアップロードすると、Claude APIが商品名・金額・日付を読み取り、カテゴリ別に集計してグラフで表示する家計簿Webアプリです。

## 主な機能

- レシート画像のアップロードと自動読み取り（Claude Haiku 4.5）
- 商品ごとのカテゴリ自動分類（食費・日用品・外食・交通費・医療費・衣服・娯楽・その他）
- カテゴリ別の円グラフ、月別の棒グラフ
- 明細の一覧表示（カテゴリの修正・削除ができます）
- データはブラウザのローカルストレージに保存されます

## 必要なもの

- Node.js 22以上
- Claude APIのキー（[Anthropic Console](https://console.anthropic.com/) で発行）

## セットアップ

```bash
# 依存パッケージをインストール
npm run install:all

# 環境変数ファイルを作成して、ANTHROPIC_API_KEY を設定する
cp server/.env.example server/.env
```

## 起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開きます。
