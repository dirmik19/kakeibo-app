// レシート画像を選択して、サーバー経由でClaude APIに読み取らせるコンポーネント
import { useEffect, useRef, useState } from "react";
import { resizeImage } from "../utils.js";

export default function ReceiptUploader({ onScanned }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // プレビュー用のURLは不要になったら解放する
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(e) {
    setError("");
    setFile(e.target.files[0] ?? null);
  }

  async function handleScan() {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const image = await resizeImage(file);
      const formData = new FormData();
      formData.append("receipt", image, "receipt.jpg");

      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "読み取りに失敗しました。");
      }
      if (data.items.length === 0) {
        throw new Error(
          "商品を読み取れませんでした。レシート全体が写った明るい画像でお試しください。",
        );
      }

      onScanned(data);
      // 次のレシートを選べるように入力をリセットする
      setFile(null);
      setPreviewUrl(null);
      inputRef.current.value = "";
    } catch (err) {
      // fetch自体が失敗した場合はサーバーが起動していない可能性が高い
      setError(
        err instanceof TypeError
          ? "サーバーに接続できませんでした。サーバーが起動しているか確認してください。"
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>レシートを読み取る</h2>
      <div className="uploader">
        <label className="file-picker">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <span>{file ? file.name : "画像を選択"}</span>
        </label>
        <button
          type="button"
          className="primary"
          onClick={handleScan}
          disabled={!file || loading}
        >
          {loading ? "読み取り中…" : "読み取る"}
        </button>
      </div>
      {previewUrl && (
        <img className="preview" src={previewUrl} alt="選択したレシート" />
      )}
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
