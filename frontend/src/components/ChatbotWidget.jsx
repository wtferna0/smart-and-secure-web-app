import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ChatbotWidget.css";

// Tiny FAQ brain (no backend needed; swap later if you want)
function faqReply(text) {
  const q = text.toLowerCase().trim();

  if (/(hour|open|close|time)/.test(q)) {
    return "We’re open Mon–Fri 7:00 AM–9:00 PM, Sat 8:00 AM–9:00 PM, Sun 8:00 AM–6:00 PM.";
  }
  if (/(menu|drink|coffee|food)/.test(q)) {
    return "Browse the full menu under Menu → categories (Hot/Cold, Cakes, Cookies, Short-eats).";
  }
  if (/(contact|phone|email|location|address|where)/.test(q)) {
    return "Find us at 123 Innovation Street, Tech District, Downtown. Phone +91 98765 43210 • hello@qwikbrew.com";
  }
  if (/(order|pickup|ready|delivery)/.test(q)) {
    return "Place orders on the Menu and pick up at the counter. Track orders in My Profile → Orders.";
  }
  if (/(promo|discount|code|coupon|reward)/.test(q)) {
    return "Try SAVE10 (10% off) or play the Puzzle to earn rewards. Apply codes at Checkout.";
  }
  return `Got it! You said: “${text}”. I’m a demo assistant — ask me about hours, menu, contact, orders, or rewards.`;
}

const STORAGE_KEY = "qwikbrew_chat_history_v1";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "b0", role: "bot", ts: Date.now(), content: "Hi! I’m your Brew assistant ☕ How can I help?" },
    ];
  });

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // persist history
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // auto-scroll to bottom on new messages/open
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, typing]);

  const canSend = useMemo(() => text.trim().length > 0 && !typing, [text, typing]);

  function send(e) {
    e?.preventDefault();
    if (!canSend) return;

    const content = text.trim();
    const userMsg = { id: "u" + crypto.randomUUID(), role: "user", ts: Date.now(), content };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setTyping(true);

    // Fake "thinking" delay
    const reply = faqReply(content);
    setTimeout(() => {
      const botMsg = { id: "b" + crypto.randomUUID(), role: "bot", ts: Date.now(), content: reply };
      setMessages((m) => [...m, botMsg]);
      setTyping(false);
    }, 500 + Math.random() * 500);
  }

  function clearChat() {
    setMessages([{ id: "b0", role: "bot", ts: Date.now(), content: "Chat cleared. How can I help now?" }]);
    setTyping(false);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <>
      {/* Floating round button with a proper chat icon */}
      <button
        className="chat-fab"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4 4v-4a3 3 0 0 1-1-2V5z" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chatbot">
          <div className="chat-head">
            <div className="chat-title">
              <span className="dot" /> BrewBot
            </div>
            <div className="chat-actions">
              <button className="btn ghost" onClick={clearChat} title="Clear conversation">Clear</button>
              <button className="btn ghost" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          <div className="chat-list" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">{m.content}</div>
              </div>
            ))}
            {typing && (
              <div className="msg bot">
                <div className="bubble typing">
                  <span className="dot1" />
                  <span className="dot2" />
                  <span className="dot3" />
                </div>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={send}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
            />
            <button className="btn primary" type="submit" disabled={!canSend}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}
