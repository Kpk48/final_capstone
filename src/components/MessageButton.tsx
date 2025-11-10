"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MessageButtonProps {
  recipientProfileId: string;
  recipientName?: string;
  applicationId?: string;
  variant?: "default" | "icon" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MessageButton({
  recipientProfileId,
  recipientName,
  applicationId,
  variant = "default",
  size = "md",
  className = ""
}: MessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMessage = async () => {
    setLoading(true);
    try {
      // Just redirect to messages page with recipient info
      // No message sent until user types something
      const params = new URLSearchParams({
        recipient: recipientProfileId,
        ...(recipientName && { name: recipientName }),
        ...(applicationId && { application: applicationId })
      });
      
      router.push(`/messages?${params.toString()}`);
    } catch (err) {
      console.error("Message error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleMessage}
        disabled={loading}
        className={`p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition ${className}`}
        title={`Message ${recipientName || "user"}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
        ) : (
          <MessageSquare className="h-4 w-4 text-indigo-400" />
        )}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <Button
        onClick={handleMessage}
        disabled={loading}
        className={`bg-transparent border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <MessageSquare className="h-4 w-4 mr-2" />
        )}
        Message {recipientName ? recipientName : ""}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleMessage}
      disabled={loading}
      className={`bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <MessageSquare className="h-4 w-4 mr-2" />
      )}
      Message {recipientName ? recipientName : ""}
    </Button>
  );
}
