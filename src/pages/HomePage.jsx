import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-200 to-indigo-300 text-center px-4">
      <h1 className="text-3xl font-bold mb-6">🔮 欢迎来到塔罗解读助手</h1>
      <p className="mb-8 text-lg">
        请选择你要使用的版本：
      </p>
      <div className="flex gap-6">
        <a
          href="/tarot/#/mobile"
          className="bg-purple-600 text-white px-6 py-3 rounded text-lg hover:bg-purple-700"
        >
          📱 移动版
        </a>
        <a
          href="/tarot/#/pc"
          className="bg-blue-600 text-white px-6 py-3 rounded text-lg hover:bg-blue-700"
        >
          💻 桌面版
        </a>
      </div>
    </div>
  );
}
