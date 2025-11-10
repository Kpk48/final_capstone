"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    type: "navigate" | "open" | "search";
    target: string;
    label: string;
  };
}

type ToastTone = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const TOAST_TONE_CLASSES: Record<"info" | "success" | "error", string> = {
  info: "border-white/20 bg-white/10 text-white",
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/40 bg-red-500/15 text-red-100",
};

export default function Carlos() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Carlos, your navigation assistant. 🤖\n\nI can help you explore the platform and take you anywhere you need!\n\n💡 Quick actions below • Press / to open chat • Esc to close\n\nTry: \"show me analytics\" or \"go to my profile\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when chat opens (with small delay for DOM to be ready)
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      // Auto-focus the input once the modal is visible
      setTimeout(() => {
        const inputEl = document.querySelector<HTMLInputElement>(
          'input[placeholder="Ask Carlos anything..."]'
        );
        inputEl?.focus();
      }, 140);
    }
  }, [isOpen]);

  // Keyboard shortcuts for quick access
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }

      if (event.key === "/" && !isOpen && event.target === document.body) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const executeAction = (action: Message["action"]) => {
    if (!action) return;

    setExecutingAction(true);

    switch (action.type) {
      case "navigate":
        router.push(action.target);
        // Stop spinner after navigation starts
        setTimeout(() => setExecutingAction(false), 1000);
        break;
      case "open":
        window.open(action.target, "_blank");
        setExecutingAction(false);
        break;
      case "search":
        // For search actions, navigate with query
        router.push(action.target);
        setTimeout(() => setExecutingAction(false), 1000);
        break;
    }
  };

  const showToast = (message: string, tone: ToastTone = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const copyMessage = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Copied to clipboard", "success"))
      .catch(() => showToast("Copy failed. Try again.", "error"));
  };

  const clearConversation = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm Carlos, your navigation assistant. 🤖\n\nI can help you explore the platform and take you anywhere you need!\n\n💡 Quick actions below • Press / to open chat • Esc to close\n\nTry: \"show me analytics\" or \"go to my profile\"",
        timestamp: new Date(),
      },
    ]);
    setShowQuickActions(true);
    showToast("Conversation cleared", "info");
  };

  const quickActions = [
    { label: "📊 Analytics", command: "show me analytics" },
    { label: "👤 Profile", command: "go to my profile" },
    { label: "🔍 Browse", command: "browse internships" },
    { label: "📝 Post internship", command: "post internship" },
  ];

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowQuickActions(false);

    try {
      const res = await fetch("/api/carlos/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-5), // Last 5 messages for context
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        action: data.action, // Action from API
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-execute action if provided
      if (data.action && data.action.autoExecute) {
        setTimeout(() => {
          executeAction(data.action);
        }, 800);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toasts */}
      <div className="fixed bottom-28 right-6 z-[60] flex w-72 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-lg shadow-black/30 ${TOAST_TONE_CLASSES[toast.tone]}`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="ml-3 text-white/70 transition hover:text-white"
              aria-label="Dismiss toast"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-tour="carlos"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-purple-500/50"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold">
            <Sparkles className="h-3 w-3" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-purple-950/95 via-black/95 to-black/95 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-black"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">Carlos</h3>
                <p className="text-xs text-zinc-400">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`group flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/10 text-zinc-200 border border-white/10"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {/* Copy message */}
                  <button
                    type="button"
                    onClick={() => copyMessage(msg.content)}
                    className="absolute top-2 right-2 hidden text-xs text-white/60 transition-opacity hover:text-white group-hover:inline"
                    title="Copy message"
                  >
                    📋
                  </button>

                  {/* Show spinner only for the latest message with action while executing */}
                  {msg.action && executingAction && idx === messages.length - 1 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-purple-200">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Taking you there…</span>
                    </div>
                  )}

                  <p className="mt-1 text-xs opacity-60">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carlos is typing...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {showQuickActions && (
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
                Quick actions
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.command}
                    type="button"
                    onClick={() => {
                      setInput(action.command);
                      setTimeout(() => {
                        const inputEl = document.querySelector<HTMLInputElement>(
                          'input[placeholder="Ask Carlos anything..."]'
                        );
                        inputEl?.focus();
                      }, 10);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearConversation}
                className="mt-3 text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                🧹 Clear conversation
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Carlos anything..."
                  className="bg-white/5 border-white/10"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-500 text-center">
              Powered by AI • Carlos is here to help
            </p>
          </form>
        </div>
      )}
    </>
  );
}
