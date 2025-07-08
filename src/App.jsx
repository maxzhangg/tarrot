import { useState, useEffect } from "react";
import { getCardIndex } from "./utils/hash";
import KeyInput from "./components/KeyInput";
import CardDisplay from "./components/CardDisplay";
import ChatMessageList from "./components/ChatMessageList";
import ChatInput from "./components/ChatInput";

function App() {
  const [question, setQuestion] = useState("");
  const [card, setCard] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [tarotDeck, setTarotDeck] = useState([]);
  const [messages, setMessages] = useState([
    { role: "system", content: "你是一个经验丰富的塔罗解读师。" }
  ]);
  const [loading, setLoading] = useState(false);

  // 加载 tarot.json
  useEffect(() => {
    fetch("/tarot.json")
      .then((res) => res.json())
      .then((data) => setTarotDeck(data))
      .catch((err) => console.error("无法加载 tarot.json", err));
  }, []);

  // 抽牌并触发 GPT 解读
  async function drawCard() {
    if (!question.trim()) return alert("请输入一个问题！");
    const timestamp = Date.now().toString();
    const index = await getCardIndex(question, timestamp);
    const selected = tarotDeck[index];
    setCard(selected);

    const userMessage = `我抽到了「${selected.name}」，问题是「${question}」，请解读这张牌。`;
    await handleSend(userMessage);
  }

  // 发送消息到 DeepSeek 并更新消息记录
  async function handleSend(userInput) {
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setLoading(true);

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: newMessages
      })
    });

    const json = await res.json();
    const assistantReply = json.choices?.[0]?.message?.content || "出错了，无法获取回复。";

    setMessages([...newMessages, { role: "assistant", content: assistantReply }]);
    setLoading(false);
  }

  return (
    <div className="h-screen flex justify-center items-start bg-gray-50">
      <div className="flex w-full max-w-5xl border rounded shadow bg-white my-6">
        {/* 左侧：抽牌 */}
        <div className="w-1/2 border-r p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">塔罗抽牌解读器</h1>
          <textarea
            className="border p-2 w-full"
            rows={3}
            placeholder="请输入你的问题..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={drawCard} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded">
            抽牌并解读
          </button>
          <CardDisplay card={card} />
        </div>

        {/* 右侧：聊天框 */}
        <div className="w-1/2 p-4 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-semibold mb-2">GPT 解读</h2>
          <KeyInput onKeyChange={setApiKey} />
          <ChatMessageList messages={messages} />
          <ChatInput onSend={handleSend} disabled={loading || !apiKey} />
        </div>
      </div>
    </div>
  );
}

export default App;
