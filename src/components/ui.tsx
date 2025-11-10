import React from "react";
import { Loader2 } from "lucide-react";

export function Card({
                         children,
                         className = "",
                     }: React.PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-transform hover:-translate-y-1 hover:border-purple-400/30 hover:shadow-[0_20px_40px_-10px_rgba(168,85,247,0.3)] ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
            <div className="relative z-10">{children}</div>
        </div>
    );
}

export function Button({
                           children,
                           className = "",
                           loading = false,
                           disabled,
                           ...props
                       }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return (
        <button
            disabled={disabled || loading}
            className={`relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-900/20 transition-all hover:brightness-110 hover:shadow-purple-500/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            {...props}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}

export function Input({
                          className = "",
                          ...props
                      }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/30 dark:bg-zinc-900/60 ${className}`}
            {...props}
        />
    );
}

export function Textarea({
                             className = "",
                             ...props
                         }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={`w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/30 dark:bg-zinc-900/60 ${className}`}
            {...props}
        />
    );
}

export function Label({
                          children,
                          className = "",
                      }: React.PropsWithChildren<{ className?: string }>) {
    return (
        <label
            className={`mb-1 block text-sm font-medium tracking-wide text-zinc-200 ${className}`}
        >
            {children}
        </label>
    );
}
