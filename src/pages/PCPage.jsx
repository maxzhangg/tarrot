import { useState, useEffect } from "react";
import { getCardIndex } from "../utils/hash";
import ReactMarkdown from "react-markdown";
import { useLang } from "../context/LanguageProvider";

export default function PCPage() {
  const [question, setQuestion] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tarotDeck, setTarotDeck] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLang();

  useEffect(() => {
    const tarotPath = lang === "zh" ? "./tarot_zh.json" : "./tarot_en.json";
    fetch(tarotPath)
      .then((res) => res.json())
      .then((data) => setTarotDeck(data))
      .catch((err) => alert(t("load_error") + err.message));
  }, [lang]);

  useEffect(() => {
    const index = sessions.findIndex((s) => s.pending);
    if (index !== -1 && apiKey) {
      const session = sessions[index];
      fetchReply(index, session.messages);
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
    if (!question.trim()) return alert(t("enter_question"));
    if (!apiKey) return alert(t("enter_key"));

    const timestamp = Date.now().toString();
    const index = await getCardIndex(question, timestamp);
    const card = tarotDeck[index];
    if (!card) return alert(t("card_error"));

    const systemMsg = { role: "system", content: t("system_prompt") };
    const userMsg = {
      role: "user",
      content: `${t("prompt_prefix")}「${question}」，${t("prompt_drawn")}「${card.name}」（${card.direction}），${t("prompt_meaning")}「${card.meaning}」。${t("prompt_request")}`
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
    if (activeSessionIndex === null) return alert(t("draw_first"));
    if (!apiKey) return alert(t("enter_key"));

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
      if (!reply) throw new Error(t("no_reply"));

      setSessions((prev) => {
        const updated = [...prev];
        updated[index].messages.push({ role: "assistant", content: reply });
        return updated;
      });
    } catch (err) {
      alert(t("reply_error") + err.message);
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
              <p className="font-bold mb-1">🎴 {t("current_card")}: {currentCard.name}</p>
              <p>🧭 {t("direction")}: {currentCard.direction}</p>
              <p>💡 {t("meaning")}: {currentCard.meaning}</p>
              {currentCard.image && (
                <img
                  src={currentCard.image}
                  alt={currentCard.name}
                  className="w-full h-auto mt-2 rounded"
                />
              )}
            </div>
          ) : (
            <p className="text-gray-500">{t("draw_first")}</p>
          )}
        </div>

        {/* 右边聊天与输入 */}
        <div className="w-2/3 flex flex-col bg-white">
          {/* 顶部 API Key */}
          <div className="p-3 border-b">
            <input
              type="password"
              className="border p-2 rounded w-full"
              placeholder={t("key_placeholder")}
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
              placeholder={t("question_placeholder")}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleDrawCard}
                className="flex-1 bg-purple-600 text-white px-3 py-2 rounded"
              >
                {t("draw_button")}
              </button>
              <button
                onClick={handleSend}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded"
                disabled={activeSessionIndex === null || loading}
              >
                {t("send_button")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
