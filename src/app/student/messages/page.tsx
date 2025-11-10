"use client";
import { useEffect, useState, useRef } from "react";
import { Card, Button, Input } from "@/components/ui";
import { MessageSquare, Send, Loader2, Building, Calendar, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_type: "student" | "company";
  is_read: boolean;
}

interface Conversation {
  application_id: string;
  internship_title: string;
  company_name: string;
  application_status: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      markAsRead(selectedConversation);
    }
  }, [selectedConversation, conversations]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (applicationId: string) => {
    try {
      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId }),
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: selectedConversation,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage("");
        await loadConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const currentConversation = conversations.find(
    (c) => c.application_id === selectedConversation
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header */}
        <section className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <MessageSquare className="h-8 w-8 text-purple-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Messages
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Communicate with companies about your applications
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : conversations.length === 0 ? (
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <MessageSquare className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Messages Yet</h3>
            <p className="text-zinc-400 text-sm">
              Messages from companies will appear here after you apply to internships
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4 overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Conversations</h2>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.application_id}
                    onClick={() => setSelectedConversation(conv.application_id)}
                    className={`w-full text-left p-4 rounded-xl transition ${
                      selectedConversation === conv.application_id
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-white line-clamp-1">
                        {conv.internship_title}
                      </h3>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2 line-clamp-1">
                      {conv.company_name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getStatusColor(conv.application_status)}`}>
                        {conv.application_status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
              {!currentConversation ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {currentConversation.internship_title}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {currentConversation.company_name}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation.messages.length === 0 ? (
                      <div className="text-center text-zinc-500 py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      currentConversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === "student" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              msg.sender_type === "student"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : "bg-white/10 text-zinc-100 border border-white/20"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <p className={`text-xs mt-2 ${
                              msg.sender_type === "student" ? "text-white/70" : "text-zinc-500"
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-white/10 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
