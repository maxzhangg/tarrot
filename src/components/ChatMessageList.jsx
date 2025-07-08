import React from "react";
import ReactMarkdown from "react-markdown";

export default function ChatMessageList({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-100 rounded max-h-[60vh]">
      {messages
        .filter((m) => m.role !== "system")
        .map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 p-3 rounded text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-100 text-right"
                : "bg-white text-left border"
            }`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
    </div>
  );
}
