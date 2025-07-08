import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput(""); // 清空输入框
  };

  return (
    <form onSubmit={handleSubmit} className="flex mt-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入问题并回车发送..."
        className="flex-1 border rounded-l px-3 py-2 text-sm bg-gray-100"
        disabled={disabled}
      />
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-r text-sm"
        disabled={disabled}
      >
        发送
      </button>
    </form>
  );
}
