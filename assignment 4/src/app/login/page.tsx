"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState<{ error?: string } | null, FormData>(
    async (_prev: { error?: string } | null, fd: FormData) => login(fd),
    null
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)]">
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-[var(--foreground)]/60 mb-8">Sign in to your account</p>

        {state?.error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm">
            {state.error}
          </div>
        )}

        <div className="bg-[var(--foreground)]/5 p-4 rounded-lg mb-6 text-sm">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <div className="flex justify-between items-center bg-[var(--background)] p-2 rounded border border-[var(--foreground)]/10 mb-2 cursor-pointer hover:border-[var(--accent)] transition-colors" onClick={() => {
            (document.getElementById("email") as HTMLInputElement).value = "priya@mentormatch.dev";
            (document.getElementById("password") as HTMLInputElement).value = "demo1234";
          }}>
            <span>Founder: priya@mentormatch.dev</span>
            <span className="text-[var(--foreground)]/50">demo1234</span>
          </div>
          <div className="flex justify-between items-center bg-[var(--background)] p-2 rounded border border-[var(--foreground)]/10 cursor-pointer hover:border-[var(--accent)] transition-colors" onClick={() => {
            (document.getElementById("email") as HTMLInputElement).value = "arjun@mentormatch.dev";
            (document.getElementById("password") as HTMLInputElement).value = "demo1234";
          }}>
            <span>Mentor: arjun@mentormatch.dev</span>
            <span className="text-[var(--foreground)]/50">demo1234</span>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[var(--foreground)] text-[var(--background)] py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--foreground)]/60">
          Don't have an account? <Link href="/register" className="text-[var(--accent)] hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
