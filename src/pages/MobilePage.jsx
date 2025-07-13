import { useState, useEffect } from "react";
import { getCardIndex } from "../utils/hash";
import ReactMarkdown from "react-markdown";
import { useLang } from "../context/LanguageProvider";

export default function MobilePage() {
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
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-3">
        <h1 className="text-xl font-bold mb-3">📱 {t("mobile_title")}</h1>
        <input
          type="password"
          className="border p-2 rounded w-full mb-3"
          placeholder={t("key_placeholder")}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-32">
        {sessions.map((session, sIdx) => (
          <div key={sIdx} className="mb-6 border-t pt-3">
            <div className="bg-yellow-100 border rounded p-3 text-sm">
              <p className="font-bold mb-1">🎴 {t("current_card")}: {session.card.name}</p>
              <p>🧭 {t("direction")}: {session.card.direction}</p>
              <p>💡 {t("meaning")}: {session.card.meaning}</p>
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <textarea
          rows={2}
          className="border w-full p-2 rounded mb-2"
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
  );
}
