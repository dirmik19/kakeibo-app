// OSのライト/ダークモード設定を取得するフック（グラフの色の切り替えに使う）
import { useEffect, useState } from "react";

const query = "(prefers-color-scheme: dark)";

export function useColorScheme() {
  const [scheme, setScheme] = useState(() =>
    window.matchMedia(query).matches ? "dark" : "light",
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = (e) => setScheme(e.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return scheme;
}
