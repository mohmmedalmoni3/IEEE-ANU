"use client";

import PageShell from "@/components/PageShell";
import { apiPost } from "@/lib/api";
import { Bot, Send, User } from "lucide-react";
import { useState } from "react";

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "مرحباً! أنا مساعد IEEE ANU الذكي. كيف يمكنني مساعدتك اليوم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiPost("/ai/chat", {
        messages: [...messages, userMessage]
      });

      if (response.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "حدث خطأ في الاتصال. حاول مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageShell>
      <div className="ai-chat-page">
        <div className="chat-header">
          <Bot size={32} />
          <div>
            <h1>مساعد IEEE ANU الذكي</h1>
            <p>اسألني أي سؤال عن IEEE ANU أو كيفية الانضمام</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-icon"><Bot size={20} /></div>
              <div className="message-content typing">جاري الكتابة...</div>
            </div>
          )}
        </div>

        <div className="chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            rows={1}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </PageShell>
  );
}
