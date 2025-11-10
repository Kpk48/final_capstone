"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/supabaseClient";

function parseHashTokens(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  return { accessToken, refreshToken, type };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const ensureRecoverySession = useCallback(async () => {
    try {
      const hashTokens = parseHashTokens(window.location.hash);
      if (hashTokens.accessToken && hashTokens.refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: hashTokens.accessToken,
          refresh_token: hashTokens.refreshToken,
        });
        if (setSessionError) {
          throw setSessionError;
        }
        // Clear the hash to avoid confusion on refresh
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !data.user) {
        throw getUserError ?? new Error("Password reset link is invalid or expired.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Unable to validate reset link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    ensureRecoverySession();
  }, [ensureRecoverySession]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      setSuccess("Your password has been updated. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black text-white">
        <p className="text-sm text-zinc-300">Preparing password reset…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-sm text-zinc-300/80">
            Enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label className="text-zinc-300">New password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Confirm new password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
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
            {loading ? "Updating password…" : "Update password"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Need help?{' '}
          <Link href="/forgot-password" className="text-purple-400 underline underline-offset-4 hover:text-purple-300">
            Request another reset link
          </Link>
        </p>
      </Card>
    </div>
  );
}
