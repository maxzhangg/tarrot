import React, { useState } from "react";

export default function ChatInput({ onSend, onDraw, disabled }) {
  const [input, setInput] = useState("");

  function handleSend() {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  }

  function handleDraw() {
    if (input.trim()) {
      onDraw(input);
      setInput("");
    }
  }

  return (
    <div className="flex">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        className="flex-1 border px-2 py-1 rounded-l"
        placeholder="输入问题并回车发送..."
        disabled={disabled}
      />
      <button
        className="bg-yellow-500 text-white px-4 py-1 rounded-r hover:bg-yellow-600"
        onClick={handleDraw}
        disabled={disabled}
      >
        抽牌
      </button>
      <button
        className="bg-purple-600 text-white px-4 py-1 ml-2 rounded hover:bg-purple-700"
        onClick={handleSend}
        disabled={disabled}
      >
        发送
      </button>
    </div>
  );
}
