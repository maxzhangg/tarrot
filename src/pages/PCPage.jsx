import { useState, useEffect } from "react";
import { getCardIndex } from "../utils/hash";
import ReactMarkdown from "react-markdown";

export default function PCPage() {
  const [question, setQuestion] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tarotDeck, setTarotDeck] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("./tarot_zh.json")
      .then((res) => res.json())
      .then((data) => setTarotDeck(data))
      .catch(() => alert("卡牌数据无效或未加载"));
  }, []);

  useEffect(() => {
    const index = sessions.findIndex((s) => s.pending);
    if (index !== -1 && apiKey) {
      const session = sessions[index];
      const msgs = session.messages;

      fetchReply(index, msgs);

      setSessions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], pending: false };
        return updated;
      });
    }
  }, [sessions]);

  const currentCard = sessions[activeSessionIndex]?.card || null;
  const messages = sessions[activeSessionIndex]?.messages || [];

  async function handleDrawCard() {
    if (!question.trim()) return alert("请输入问题");
    if (!apiKey) return alert("请填写 API Key");

    const timestamp = Date.now().toString();
    const index = await getCardIndex(question, timestamp);
    const card = tarotDeck[index];
    if (!card) return alert("抽牌失败，请检查数据");

    const systemMsg = { role: "system", content: "你是一个经验丰富的塔罗解读师。" };
    const userMsg = {
      role: "user",
      content: `问题是：「${question}」，我抽到了「${card.name}」（${card.direction}），含义为「${card.meaning}」。请详细解读这张牌。`
    };

    const newSession = {
      card,
      messages: [systemMsg, userMsg],
      pending: true
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionIndex(sessions.length);
    setQuestion("");
  }

  async function handleSend() {
    if (!question.trim()) return;
    if (activeSessionIndex === null) return alert("请先抽牌再提问");
    if (!apiKey) return alert("请填写 API Key");

    const userMsg = { role: "user", content: question };
    const updatedMessages = [...messages, userMsg];

    setQuestion("");

    setSessions((prev) => {
      const updated = [...prev];
      updated[activeSessionIndex] = {
        ...updated[activeSessionIndex],
        messages: updatedMessages
      };
      return updated;
    });

    fetchReply(activeSessionIndex, updatedMessages);
  }

  async function fetchReply(index, msgs) {
    setLoading(true);
    try {
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
      const reply = json.choices?.[0]?.message?.content;
      if (!reply) throw new Error("AI 无回复");

      setSessions((prev) => {
        const updated = [...prev];
        updated[index].messages.push({ role: "assistant", content: reply });
        return updated;
      });
    } catch (err) {
      alert("请求出错：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage(msg, idx) {
    if (msg.role === "user" || msg.role === "assistant") {
      return (
        <div
          key={idx}
          className={`p-2 my-1 text-sm rounded whitespace-pre-wrap ${
            msg.role === "user"
              ? "bg-blue-100 text-right"
              : "bg-white text-left border"
          }`}
        >
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 p-4">
      <div className="flex w-full max-w-6xl h-[90vh] border rounded shadow overflow-hidden">
        {/* 左边卡牌显示 */}
        <div className="w-1/3 bg-yellow-50 p-4 overflow-y-auto">
          {currentCard ? (
            <div className="border rounded p-3 text-sm">
              <p className="font-bold mb-1">🎴 当前塔罗牌：{currentCard.name}</p>
              <p>🧭 方向：{currentCard.direction}</p>
              <p>💡 含义：{currentCard.meaning}</p>
              {currentCard.image && (
                <img
                  src={currentCard.image}
                  alt={currentCard.name}
                  className="w-full h-auto mt-2 rounded"
                />
              )}
            </div>
          ) : (
            <p className="text-gray-500">请先抽一张牌</p>
          )}
        </div>

        {/* 右边聊天与输入 */}
        <div className="w-2/3 flex flex-col bg-white">
          {/* 顶部 API Key */}
          <div className="p-3 border-b">
            <input
              type="password"
              className="border p-2 rounded w-full"
              placeholder="请输入你的 DeepSeek API Key"
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {/* 聊天内容 */}
          <div className="flex-1 overflow-y-auto p-3">
            {messages.filter((m) => m.role !== "system").map((m, i) => renderMessage(m, i))}
          </div>

          {/* 底部输入 */}
          <div className="p-3 border-t flex gap-2 items-end">
            <textarea
              rows={2}
              className="border p-2 rounded w-full"
              placeholder="请输入问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex gap-2">
          <button
            onClick={handleDrawCard}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded"
          >
            抽牌
          </button>
          <button
            onClick={handleSend}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded"
            disabled={activeSessionIndex === null || loading}
          >
            发送
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
