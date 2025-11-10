"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";
import { MessageSquare, Send, Loader2, X, Search, Plus, User, Building2, GraduationCap } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_profile_id: string;
  is_read: boolean;
}

export default function UniversalMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

interface Conversation {
  conversation_id: string;
  other_user: {
    profile_id: string;
    name: string;
    role: string;
    email: string;
  };
  application?: {
    id: string;
    status: string;
    internship_title: string;
  };
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

interface UserToMessage {
  profile_id: string;
  name: string;
  email: string;
  role: string;
  university?: string;
  degree?: string;
  website?: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");
  const [users, setUsers] = useState<UserToMessage[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation from URL params (but no message sent yet)
  const recipientFromUrl = searchParams?.get("recipient");
  const recipientName = searchParams?.get("name");
  const applicationId = searchParams?.get("application");

  useEffect(() => {
    loadConversations();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    // If recipient in URL, check if conversation exists or prepare new one
    if (recipientFromUrl && conversations.length > 0) {
      const existingConv = conversations.find(
        c => c.other_user.profile_id === recipientFromUrl
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv.conversation_id);
      } else {
        // Create a temporary "new conversation" state
        setSelectedConversation("new");
      }
    }
  }, [recipientFromUrl, conversations]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserProfileId(data.profile?.id || null);
      }
    } catch (err) {
      console.error("Failed to load current user:", err);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      markAsRead(selectedConversation);
    }
  }, [selectedConversation, conversations]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messaging/conversations");
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

  const searchUsersList = async () => {
    if (!searchUsers.trim()) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/messaging/users?search=${encodeURIComponent(searchUsers)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to search users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startConversation = async (user: UserToMessage) => {
    // Send initial message to create conversation
    setShowNewChat(false);
    setSearchUsers("");
    setUsers([]);
    
    // Create a temporary conversation UI
    const tempConv: Conversation = {
      conversation_id: "temp",
      other_user: {
        profile_id: user.profile_id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      messages: []
    };
    
    setConversations([tempConv, ...conversations]);
    setSelectedConversation("temp");
  };

  const markAsRead = async (conversationId: string) => {
    if (conversationId === "temp") return;
    
    try {
      await fetch("/api/messaging/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      let recipientId: string;
      let appId: string | null = null;

      // Handle new conversation from URL params
      if (selectedConversation === "new" && recipientFromUrl) {
        recipientId = recipientFromUrl;
        appId = applicationId || null;
      } else {
        // Existing conversation
        const currentConv = conversations.find(c => c.conversation_id === selectedConversation);
        if (!currentConv) {
          setSending(false);
          return;
        }
        recipientId = currentConv.other_user.profile_id;
        appId = currentConv.application?.id || null;
      }

      const res = await fetch("/api/messaging/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_profile_id: recipientId,
          content: newMessage.trim(),
          application_id: appId
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewMessage("");
        await loadConversations();
        
        // Switch to the newly created conversation
        if (selectedConversation === "new" && data.conversation_id) {
          setSelectedConversation(data.conversation_id);
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const currentConversation = conversations.find(
    (c) => c.conversation_id === selectedConversation
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "text-blue-400";
      case "company":
        return "text-purple-400";
      case "admin":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header */}
        <section className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold">
              <MessageSquare className="h-8 w-8 text-indigo-400" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Messages
              </span>
            </h1>
            <p className="mt-2 text-sm text-zinc-300/80">
              Connect with students, companies, and other users
            </p>
          </div>
          <Button
            onClick={() => setShowNewChat(!showNewChat)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </section>

        {/* New Chat Modal */}
        {showNewChat && (
          <Card className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Start New Conversation</h2>
              <button onClick={() => setShowNewChat(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <Input
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchUsersList()}
                placeholder="Search by name or email..."
                className="flex-1"
              />
              <Button onClick={searchUsersList} disabled={loadingUsers}>
                {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.profile_id}
                  onClick={() => startConversation(user)}
                  className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={getRoleColor(user.role)}>{getRoleIcon(user.role)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{user.name}</h3>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                      {user.university && <p className="text-xs text-zinc-500">{user.university}</p>}
                      {user.website && <p className="text-xs text-zinc-500">{user.website}</p>}
                    </div>
                    <span className="text-xs capitalize px-2 py-1 rounded-full bg-white/10">{user.role}</span>
                  </div>
                </button>
              ))}
              {!loadingUsers && users.length === 0 && searchUsers && (
                <p className="text-center text-zinc-500 py-8">No users found</p>
              )}
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : conversations.length === 0 ? (
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <MessageSquare className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Messages Yet</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Start a conversation by clicking "New Chat" above
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
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv.conversation_id)}
                    className={`w-full text-left p-4 rounded-xl transition ${
                      selectedConversation === conv.conversation_id
                        ? "bg-indigo-500/20 border border-indigo-500/30"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={getRoleColor(conv.other_user.role)}>
                          {getRoleIcon(conv.other_user.role)}
                        </span>
                        <h3 className="font-medium text-white line-clamp-1">
                          {conv.other_user.name}
                        </h3>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.application && (
                      <p className="text-xs text-zinc-500 mb-1">
                        Re: {conv.application.internship_title}
                      </p>
                    )}
                    <span className="text-xs text-zinc-500 capitalize">
                      {conv.other_user.role}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              ) : selectedConversation === "new" ? (
                <>
                  {/* Chat Header for New Conversation */}
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-indigo-400" />
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {recipientName || "New Conversation"}
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Type your first message to start the conversation
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Messages - Empty for new conversation */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="text-center text-zinc-500 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet.</p>
                      <p className="text-sm mt-1">Start the conversation by typing below!</p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-white/10 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="Type your first message..."
                        className="flex-1"
                        disabled={sending}
                        autoFocus
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
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
              ) : currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <span className={getRoleColor(currentConversation.other_user.role)}>
                        {getRoleIcon(currentConversation.other_user.role)}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {currentConversation.other_user.name}
                        </h2>
                        <p className="text-sm text-zinc-400 capitalize">
                          {currentConversation.other_user.role}
                        </p>
                        {currentConversation.application && (
                          <p className="text-xs text-zinc-500">
                            Re: {currentConversation.application.internship_title}
                          </p>
                        )}
                      </div>
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
                      currentConversation.messages.map((msg) => {
                        // Determine if current user sent this message
                        const isCurrentUser = msg.sender_profile_id === currentUserProfileId;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                isCurrentUser
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                  : "bg-white/10 text-zinc-100 border border-white/20"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              <p className={`text-xs mt-2 ${
                                isCurrentUser ? "text-white/70" : "text-zinc-500"
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
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
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
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
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Conversation not found</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
