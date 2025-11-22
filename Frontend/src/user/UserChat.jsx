import { useEffect, useState, useRef } from "react";
import api from "../api";

export default function UserChat({ applicationId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (applicationId) loadMessages();
  }, [applicationId]);

  useEffect(() => {
    const onNewMsg = (e) => {
      const { applicationId: appId, message } = e.detail || {};
      if (String(appId) === String(applicationId)) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    window.addEventListener("app:newMessage", onNewMsg);
    return () => window.removeEventListener("app:newMessage", onNewMsg);
  }, [applicationId]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/messages/getMessages/${applicationId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await api.post(`/messages/sendMessage/${applicationId}`, { text });
      setMessages((prev) => [...prev, res.data]);
      setText("");
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    // scroll when messages change
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <div className="flex-1 overflow-y-auto bg-[#F5F5F5] rounded-lg p-4 space-y-3 shadow-sm">
        {(!messages || messages.length === 0) ? (
          <p className="text-center text-gray-400 italic mt-20">
            No messages yet. Start the conversation 👋
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                (msg?.sender?.role === "user") ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs sm:max-w-sm shadow-lg ${
                  (msg?.sender?.role === "user")
                    ? "bg-gradient-to-br from-[#999DA2] to-[#6B6F73] text-white rounded-br-none shadow-lg"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className="block text-[10px] mt-1 opacity-70 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-3 mt-3 border-t border-gray-200 pt-3 bg-white sticky bottom-0">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); 
              sendMessage();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none border border-gray-400 shadow-md rounded-2xl px-4 py-2 text-sm bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#111] transition-all max-h-32 overflow-y-hidden"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={sendMessage}
          className="hover:bg-[#e5383b] hover:text-white bg-[#111] text-[#F5F5F5] shadow-md px-5 py-2 rounded-full shadow font-medium text-sm transition active:scale-95"
        >
          Send
        </button>
      </div>

    </div>
  );
}
