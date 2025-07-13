import { useState, useEffect, useRef } from "react";
import { getCardIndex } from "../utils/hash";
import ReactMarkdown from "react-markdown";
import { useLang } from "../context/LanguageProvider";

export default function MobilePage() {
  const [question, setQuestion] = useState("");
  const [apiKey, setApiKey] = useState("");
  const storagePath = "tarot-chat.json"; // ✅ 固定文件名
  const [tarotDeck, setTarotDeck] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLang();
  const fileInputRef = useRef();

  // 加载塔罗卡片
  useEffect(() => {
    const tarotPath = lang === "zh" ? "./tarot_zh.json" : "./tarot_en.json";
    fetch(tarotPath)
      .then((res) => res.json())
      .then((data) => setTarotDeck(data))
      .catch((err) => alert(t("load_error") + err.message));
  }, [lang]);

  // 从 localStorage 加载记录
  useEffect(() => {
    const saved = localStorage.getItem(storagePath);
    if (saved) {
      const arr = JSON.parse(saved);
      setSessions(arr);
      setActiveSessionIndex(arr.length - 1);
    } else {
      setSessions([]);
      setActiveSessionIndex(null);
    }
  }, []);

  // 每次 session 更新自动保存
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(storagePath, JSON.stringify(sessions));
    }
  }, [sessions]);

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
      id: timestamp,
      card,
      messages: [systemMsg, userMsg],
      pending: true
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    setActiveSessionIndex(updated.length - 1);
    setQuestion("");
  }

  async function handleSend() {
    if (!question.trim()) return;
    if (activeSessionIndex === null) return alert(t("draw_first"));
    if (!apiKey) return alert(t("enter_key"));

    const userMsg = { role: "user", content: question };
    const updatedSessions = [...sessions];
    updatedSessions[activeSessionIndex].messages.push(userMsg);
    setSessions(updatedSessions);
    setQuestion("");

    fetchReply(activeSessionIndex, updatedSessions[activeSessionIndex].messages);
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

      const updated = [...sessions];
      updated[index].messages.push({ role: "assistant", content: reply });
      setSessions(updated);
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

  // 📥 导入 JSON 文件
  function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("格式不正确");
        localStorage.setItem(storagePath, JSON.stringify(parsed));
        setSessions(parsed);
        setActiveSessionIndex(parsed.length - 1);
        alert("✅ 已导入记录");
      } catch (err) {
        alert("❌ 导入失败：" + err.message);
      }
    };
    reader.readAsText(file);
  }

  // 📤 导出 JSON 文件
  async function handleExportToFile() {
    try {
      const saved = localStorage.getItem(storagePath);
      if (!saved) throw new Error("当前路径下无记录");

      const blob = new Blob([saved], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = storagePath;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("📥 聊天记录已通过浏览器下载");
    } catch (err) {
      alert("❌ 导出失败：" + err.message);
    }
  }

  function handleNewSession() {
    const newSession = {
      id: Date.now().toString(),
      card: {},
      messages: [],
      pending: false
    };
    const updated = [...sessions, newSession];
    setSessions(updated);
    setActiveSessionIndex(updated.length - 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ☰ Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-20 bg-gray-200 px-3 py-1 rounded"
      >
        ☰
      </button>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 w-64 h-full bg-gray-100 border-r z-10 overflow-y-auto p-4">
          <h2 className="text-lg font-bold mb-4">📜 {t("history")}</h2>
          <ul>
            {sessions.map((s, i) => (
              <li key={s.id || i} className="mb-2">
                <button
                  onClick={() => {
                    setActiveSessionIndex(i);
                    setSidebarOpen(false);
                  }}
                  className={`block w-full text-left px-2 py-1 rounded ${
                    i === activeSessionIndex ? "bg-blue-300" : "hover:bg-gray-200"
                  }`}
                >
                  🎴 {s.card?.name || "Untitled"}<br />
                  🕓 {new Date(Number(s.id || 0)).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleNewSession}
            className="mt-4 bg-green-600 text-white px-3 py-1 rounded"
          >
            🆕 {t("new_session") || "New Session"}
          </button>
        </div>
      )}

      {/* Hidden File Input for Import */}
      <input
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleImportFile}
      />

      {/* Header */}
      <div className="p-3">
        <h1 className="text-xl font-bold mb-3">📱 {t("mobile_title")}</h1>
        <input
          type="password"
          className="border p-2 rounded w-full mb-3"
          placeholder={t("key_placeholder")}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-gray-200 text-sm px-3 py-1 rounded"
          >
            📂 {t("import") || "Import"}
          </button>
          <button
            onClick={handleExportToFile}
            className="bg-gray-200 text-sm px-3 py-1 rounded"
          >
            💾 {t("export") || "Export"}
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-32">
        {activeSessionIndex !== null && sessions[activeSessionIndex] && (
          <div className="mb-6 border-t pt-3">
            {sessions[activeSessionIndex].card?.name && (
              <div className="bg-yellow-100 border rounded p-3 text-sm">
                <p className="font-bold mb-1">🎴 {t("current_card")}: {sessions[activeSessionIndex].card.name}</p>
                <p>🧭 {t("direction")}: {sessions[activeSessionIndex].card.direction}</p>
                <p>💡 {t("meaning")}: {sessions[activeSessionIndex].card.meaning}</p>
                {sessions[activeSessionIndex].card.image && (
                  <img
                    src={sessions[activeSessionIndex].card.image}
                    alt={sessions[activeSessionIndex].card.name}
                    className="w-32 h-auto mt-2 rounded"
                  />
                )}
              </div>
            )}
            <div className="mt-2">
              {sessions[activeSessionIndex].messages
                .filter((m) => m.role !== "system")
                .map((msg, idx) => renderMessage(msg, idx))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Input */}
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
