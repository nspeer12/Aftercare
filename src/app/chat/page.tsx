"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { useStore } from "@/lib/store";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "When should I take my next dose?",
  "Can I drink alcohol with these meds?",
  "What side effects should I watch for?",
  "Summarize my care plan in plain English.",
];

export default function ChatPage() {
  const { state, hydrated } = useStore();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);

    const placeholder: UiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    setMessages([...next, placeholder]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          carePlan: state.carePlans[0] ?? null,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((curr) =>
          curr.map((m) => (m.id === placeholder.id ? { ...m, content: acc } : m)),
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to reach the model";
      setMessages((curr) =>
        curr.map((m) =>
          m.id === placeholder.id
            ? { ...m, content: `⚠ ${message}` }
            : m,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="flex-1 flex flex-col">
      <Header
        title="Ask Aftercare"
        subtitle={
          state.carePlans[0]?.diagnosis ??
          (state.carePlans.length === 0
            ? "Add a care plan to ask grounded questions"
            : "Grounded in your care plan")
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-card-border bg-card p-4 text-sm">
              <div className="font-semibold mb-1">👋 Hi, I&apos;m your Aftercare assistant.</div>
              <div className="text-muted">
                I can help you understand your care plan and reinforce the habits your
                clinician recommended. I can&apos;t give medical advice — call your
                provider for anything urgent.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-card-border bg-card p-3 text-xs text-left leading-snug active:scale-[0.99]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl bg-primary text-primary-foreground p-3 text-sm"
                : "mr-8 rounded-2xl border border-card-border bg-card p-3 text-sm whitespace-pre-wrap"
            }
          >
            {m.content || (
              <span className="inline-flex gap-1">
                <span className="size-1.5 rounded-full bg-muted animate-pulse" />
                <span className="size-1.5 rounded-full bg-muted animate-pulse [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted animate-pulse [animation-delay:300ms]" />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-24 px-5 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 rounded-2xl border border-card-border bg-card p-2 shadow-lg shadow-black/5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your care plan…"
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="size-9 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M4 12l16-8-6 16-2-7-8-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
