"use client";

import { apiPost } from "@/lib/api";
import { Bot, MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "مرحباً! أنا مساعد IEEE ANU الذكي. كيف يمكنني مساعدتك؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

  if (!isOpen) {
    return (
      <button
        className="ai-chat-widget-trigger"
        onClick={() => setIsOpen(true)}
        title="مساعد IEEE ANU الذكي"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`ai-chat-widget ${isMinimized ? "minimized" : ""}`}>
      <div className="ai-chat-widget-header">
        <div className="ai-chat-widget-title">
          <Bot size={20} />
          <span>مساعد IEEE ANU</span>
        </div>
        <div className="ai-chat-widget-controls">
          <button onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "تكبير" : "تصغير"}>
            <Minimize2 size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} title="إغلاق">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="ai-chat-widget-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-chat-widget-message ${msg.role}`}>
                <div className="ai-chat-widget-message-content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-chat-widget-message assistant">
                <div className="ai-chat-widget-message-content typing">جاري الكتابة...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-widget-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              rows={1}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
