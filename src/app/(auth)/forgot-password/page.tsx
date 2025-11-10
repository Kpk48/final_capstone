"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { Button, Card, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(
        "If an account exists for this email, a password reset link has been sent. Please check your inbox."
      );
      setEmail("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-300/80">
            Enter the email associated with your account. We will send a reset link to help you choose a new password.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label className="text-zinc-300">Email address</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          {error && (
            <p className="rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? "Sending reset link..." : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Remembered your password?{' '}
          <Link href="/login" className="text-purple-400 underline underline-offset-4 hover:text-purple-300">
            Return to login
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-zinc-500">
          This page works for students, companies, and admins. Just use the email tied to your account.
        </p>
      </Card>
    </div>
  );
}
