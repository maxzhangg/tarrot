import { useState, useEffect } from "react";

export default function KeyInput({ onKeyChange }) {
  const [key, setKey] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("apiKey");
    if (savedKey) {
      setKey(savedKey);
      onKeyChange(savedKey);
    }
  }, [onKeyChange]);

  function handleSave() {
    localStorage.setItem("apiKey", key);
    onKeyChange(key);
  }

  return (
    <div className="p-2">
      <label className="text-sm">输入你的DeepSeek API Key：</label>
      <input
        type="password"
        className="border rounded p-1 w-full mt-1"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <button onClick={handleSave} className="mt-2 px-3 py-1 rounded bg-blue-500 text-white">
        保存 Key
      </button>
    </div>
  );
}
