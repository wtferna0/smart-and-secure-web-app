import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js"; // Adjust the import path
import "./ChatbotWidget.css";

const STORAGE_KEY = "qwikbrew_chat_history_v1";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "b0", role: "bot", ts: Date.now(), content: "Hi! I'm your Brew assistant ☕ How can I help? Try 'menu', 'order status', 'loyalty', 'hours', 'location', or 'crowd'." },
    ];
  });

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("qwikbrew_user_email");
    const savedName = localStorage.getItem("qwikbrew_user_name");
    if (savedEmail) setUserEmail(savedEmail);
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, typing]);

  const canSend = useMemo(() => text.trim().length > 0 && !typing, [text, typing]);

  async function send(e) {
    e?.preventDefault();
    if (!canSend) return;

    const content = text.trim();
    const userMsg = { id: "u" + crypto.randomUUID(), role: "user", ts: Date.now(), content };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setTyping(true);

    try {
      const response = await api.chatbotQuery({
        message: content,
        email: userEmail,
        name: userName
      });
      
      const botMsg = { 
        id: "b" + crypto.randomUUID(), 
        role: "bot", 
        ts: Date.now(), 
        content: response.reply,
        data: response 
      };
      
      setMessages((m) => [...m, botMsg]);
      
    } catch (error) {
      const errorMsg = { 
        id: "b" + crypto.randomUUID(), 
        role: "bot", 
        ts: Date.now(), 
        content: "Sorry, I encountered an error. Please try again." 
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setTyping(false);
    }
  }

  function clearChat() {
    setMessages([{ id: "b0", role: "bot", ts: Date.now(), content: "Chat cleared. How can I help now?" }]);
    setTyping(false);
    setText("");
    inputRef.current?.focus();
  }

  function updateUserInfo() {
    const email = prompt("Enter your email for order tracking:", userEmail || "");
    const name = prompt("Enter your name:", userName || "");
    
    if (email !== null) {
      setUserEmail(email);
      localStorage.setItem("qwikbrew_user_email", email);
    }
    if (name !== null) {
      setUserName(name);
      localStorage.setItem("qwikbrew_user_name", name);
    }
    
    if (email || name) {
      const infoMsg = { 
        id: "b" + crypto.randomUUID(), 
        role: "bot", 
        ts: Date.now(), 
        content: "User info updated! Now I can help you with order status and loyalty points." 
      };
      setMessages((m) => [...m, infoMsg]);
    }
  }

  function renderMessageContent(message) {
    if (message.data) {
      if (message.data.categories && message.data.sample) {
        return (
          <div>
            <div>{message.content}</div>
            <div style={{marginTop: '8px', fontSize: '0.9em'}}>
              <strong>Categories:</strong> {message.data.categories.join(', ')}
              <br/>
              <strong>Sample Items:</strong>
              <ul style={{margin: '4px 0', paddingLeft: '16px'}}>
                {message.data.sample.map((item, index) => (
                  <li key={index}>{item.name} - ${(item.price / 100).toFixed(2)}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
      
      if (message.data.buckets) {
        return (
          <div>
            <div>{message.content}</div>
            <div style={{marginTop: '8px', fontSize: '0.9em'}}>
              <strong>Recent orders by hour:</strong>
              <ul style={{margin: '4px 0', paddingLeft: '16px'}}>
                {message.data.buckets.map((bucket, index) => (
                  <li key={index}>Hour {bucket.hour}: {bucket.count} orders</li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
      
      if (message.data.order_id) {
        return (
          <div>
            {message.content}
            <div style={{marginTop: '4px', fontSize: '0.9em'}}>
              <em>Order ID: {message.data.order_id}</em>
            </div>
          </div>
        );
      }
    }
    
    return message.content;
  }

  return (
    <>
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
              {userEmail && (
                <span className="user-badge" title="Click to update info" onClick={updateUserInfo}>
                  {userName || userEmail}
                </span>
              )}
            </div>
            <div className="chat-actions">
              {!userEmail && (
                <button className="btn ghost" onClick={updateUserInfo} title="Set user info for orders">
                  Set User
                </button>
              )}
              <button className="btn ghost" onClick={clearChat} title="Clear conversation">Clear</button>
              <button className="btn ghost" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          <div className="chat-list" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">{renderMessageContent(m)}</div>
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
              placeholder="Type your message… (try: menu, order status, hours, location)"
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