"use client";

import { useState } from "react";
import type { ApiResult } from "../../types";

/**
 * The embeddable widget. Same endpoint and the same core as the demo page —
 * but without the routing explainer, because a customer should just see a chat
 * window. The routing still happens; it is simply invisible to them.
 */
export default function EmbedChat() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, conversationId }),
      });
      const data: ApiResult = await response.json();
      setConversationId(data.conversationId);
      const content =
        data.reply ??
        (data.handoff
          ? "Thanks — I’ve passed this to a colleague who will reply shortly."
          : "Sorry, I couldn’t help with that.");
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-gray-900 ${
              message.role === "user" ? "bg-blue-100 ml-auto max-w-[80%]" : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 p-4">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg text-gray-900 bg-white"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
