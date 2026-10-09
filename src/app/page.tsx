"use client";

import { useState } from "react";
import type { ApiResult, Turn } from "../types";

const BRANDS = [
  { id: "harbourhost", name: "Harbour Host (strict)" },
  { id: "lanternreach", name: "Lantern Reach (self-serve)" },
];

const ROUTE_STYLE: Record<string, string> = {
  auto: "bg-green-100 text-green-800 border-green-300",
  ai_assist: "bg-amber-100 text-amber-800 border-amber-300",
  human: "bg-rose-100 text-rose-800 border-rose-300",
};

export default function Home() {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setTurns((prev) => [...prev, { speaker: "customer", text }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, conversationId, brandId }),
      });
      const data: ApiResult = await response.json();
      if (!response.ok) throw new Error(data.error ?? "request failed");
      setConversationId(data.conversationId);
      setTurns((prev) => {
        const next = [...prev];
        if (data.reply) {
          next.push({ speaker: "ai", text: data.reply, route: data.route, reason: data.reason });
        } else {
          next.push({
            speaker: "system",
            text: data.handoff
              ? `Handed to a human — queue "${data.handoff.queue}", priority ${data.handoff.priority}, ${data.handoff.slaMinutes} min SLA.`
              : "No automatic reply was produced.",
            route: data.route,
            reason: data.reason,
          });
        }
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed";
      setTurns((prev) => [...prev, { speaker: "system", text: message }]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setConversationId(undefined);
    setTurns([]);
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 bg-white">
      <header className="mb-3">
        <h1 className="text-lg font-semibold text-gray-900">Digital Channels AI Care</h1>
        <p className="text-sm text-gray-500">
          Every reply shows the routing decision behind it: <strong>auto</strong> (AI answers),{" "}
          <strong>ai_assist</strong> (AI drafts, human approves), <strong>human</strong> (handoff).
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <label htmlFor="brand" className="text-gray-600">
            Brand:
          </label>
          <select
            id="brand"
            value={brandId}
            onChange={(event) => {
              setBrandId(event.target.value);
              reset();
            }}
            className="border rounded px-2 py-1 text-gray-900"
          >
            {BRANDS.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <button onClick={reset} className="ml-auto border rounded px-2 py-1 text-gray-600">
            Reset
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {turns.length === 0 && (
          <p className="text-sm text-gray-400">
            Try: “I’ve been charged twice this month” · “Cancel my account” · “My site is down”
          </p>
        )}
        {turns.map((turn, index) => (
          <div key={index}>
            <div
              className={`p-3 rounded-lg text-gray-900 ${
                turn.speaker === "customer"
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : turn.speaker === "ai"
                    ? "bg-gray-100 mr-auto max-w-[80%]"
                    : "bg-yellow-50 border border-yellow-200 mr-auto max-w-[80%]"
              }`}
            >
              {turn.text}
            </div>
            {turn.route && (
              <div className={`mt-1 inline-block text-xs border rounded px-2 py-0.5 ${ROUTE_STYLE[turn.route] ?? ""}`}>
                {turn.route} · {turn.reason}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2">
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
          {busy ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
