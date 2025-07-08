import { useState, useEffect } from "react";
import { getCardIndex } from "./utils/hash";
import ChatInput from "./components/ChatInput";
import ReactMarkdown from "react-markdown";

export default function MobilePage() {
  const [question, setQuestion] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tarotDeck, setTarotDeck] = useState([]);
  const [messages, setMessages] = useState([
    { role: "system", content: "你是一个经验丰富的塔罗解读师。" }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("./tarot.json")
      .then((res) => res.json())
      .then((data) => setTarotDeck(data));
  }, []);

  async function handleDrawCard(userInput) {
    if (!userInput.trim()) return;

    const timestamp = Date.now().toString();
    const index = await getCardIndex(userInput, timestamp);
    const card = tarotDeck[index];

    const userMsg = `问题是「${userInput}」，我抽到了「${card.name}」（${card.direction}），牌义为「${card.meaning}」。请解读这张牌。`;

    setMessages((prev) => [
      ...prev,
      { role: "card", content: card },
      { role: "user", content: userMsg }
    ]);

    await fetchReply([
      ...messages,
      { role: "user", content: userMsg }
    ]);
  }

  async function handleFollowUp(userInput) {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    await fetchReply(newMessages);
  }

  async function fetchReply(msgs) {
    if (!apiKey) return alert("请先输入 DeepSeek API Key");
    setLoading(true);

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: msgs.filter((m) => m.role !== "card")
      })
    });

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content || "🤖 出错了，无法获取回复";

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  function renderMessage(msg, idx) {
    if (msg.role === "card") {
      const card = msg.content;
      return (
        <div key={idx} className="bg-yellow-100 border rounded p-3 my-2 text-sm">
          <p className="font-bold mb-1">🎴 抽到的塔罗牌：{card.name}</p>
          <p>🧭 方向：{card.direction}</p>
          <p>💡 含义：{card.meaning}</p>
          {card.image && (
            <img
              src={card.image}
              alt={card.name}
              className="w-32 h-auto mt-2 rounded"
            />
          )}
        </div>
      );
    }

    return (
      <div
        key={idx}
        className={`p-3 my-2 text-sm rounded whitespace-pre-wrap ${
          msg.role === "user"
            ? "bg-blue-100 text-right"
            : msg.role === "assistant"
            ? "bg-white text-left border"
            : "hidden"
        }`}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white p-3">
      <h1 className="text-xl font-bold mb-3">📱 塔罗聊天解读（移动版）</h1>

      <input
        type="password"
        className="border p-2 rounded mb-3"
        placeholder="请输入你的 DeepSeek API Key"
        onChange={(e) => setApiKey(e.target.value)}
      />

      <div className="flex-1 overflow-y-auto max-h-[60vh] mb-3">
        {messages.map((m, idx) => renderMessage(m, idx))}
      </div>

      <ChatInput
        onSend={(input) =>
          messages.some((m) => m.role === "card")
            ? handleFollowUp(input)
            : handleDrawCard(input)
        }
        disabled={loading || !apiKey}
      />
    </div>
  );
}
