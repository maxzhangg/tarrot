import { useState, useEffect } from "react";
import { getCardIndex } from "../utils/hash";
import ReactMarkdown from "react-markdown";

export default function MobilePage() {
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
      .catch((err) => alert("无法加载塔罗牌数据：" + err.message));
  }, []);

  // ✅ 当有 pending 的新 session 出现，自动触发解读
  useEffect(() => {
    const index = sessions.findIndex((s) => s.pending);
    if (index !== -1 && apiKey) {
      const session = sessions[index];
      const msgs = session.messages;

      fetchReply(index, msgs);

      // 标记为已处理，防止重复调用
      setSessions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], pending: false };
        return updated;
      });
    }
  }, [sessions]);

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
      pending: true // ✅ 标记为待处理
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
    const currentSession = sessions[activeSessionIndex];
    const updatedMessages = [...currentSession.messages, userMsg];

    setQuestion("");

    setSessions((prev) => {
      const updated = [...prev];
      updated[activeSessionIndex] = {
        ...currentSession,
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* 顶部 API Key 输入 */}
      <div className="p-3">
        <h1 className="text-xl font-bold mb-3">📱 塔罗聊天解读</h1>
        <input
          type="password"
          className="border p-2 rounded w-full mb-3"
          placeholder="请输入你的 DeepSeek API Key"
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      {/* 聊天历史区域 */}
      <div className="flex-1 overflow-y-auto px-3 pb-32">
        {sessions.map((session, sIdx) => (
          <div key={sIdx} className="mb-6 border-t pt-3">
            <div className="bg-yellow-100 border rounded p-3 text-sm">
              <p className="font-bold mb-1">🎴 当前塔罗牌：{session.card.name}</p>
              <p>🧭 方向：{session.card.direction}</p>
              <p>💡 含义：{session.card.meaning}</p>
              {session.card.image && (
                <img
                  src={session.card.image}
                  alt={session.card.name}
                  className="w-32 h-auto mt-2 rounded"
                />
              )}
            </div>
            <div className="mt-2">
              {session.messages
                .filter((m) => m.role !== "system")
                .map((msg, idx) => renderMessage(msg, idx))}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ 底部输入框和按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <textarea
          rows={2}
          className="border w-full p-2 rounded mb-2"
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
  );
}
