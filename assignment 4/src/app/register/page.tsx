"use client";

import { useActionState, useState } from "react";
import { register } from "@/lib/actions/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState<{ error?: string } | null, FormData>(
    async (_prevState, formData: FormData) => register(formData),
    null
  );

  const [role, setRole] = useState<"FOUNDER" | "MENTOR">("FOUNDER");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)]">
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Create account</h1>
        <p className="text-[var(--foreground)]/60 mb-8">Join MentorMatch today</p>

        {state?.error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm">
            {state.error}
          </div>
        )}

        <form action={action} className="flex flex-col gap-4">
          <div className="flex bg-[var(--foreground)]/5 p-1 rounded-lg mb-2">
            <button
              type="button"
              onClick={() => setRole("FOUNDER")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === "FOUNDER" ? "bg-[var(--background)] shadow-sm" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"}`}
            >
              I'm a Founder
            </button>
            <button
              type="button"
              onClick={() => setRole("MENTOR")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === "MENTOR" ? "bg-[var(--background)] shadow-sm" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"}`}
            >
              I'm a Mentor
            </button>
          </div>
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[var(--foreground)] text-[var(--background)] py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {isPending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--foreground)]/60">
          Already have an account? <Link href="/login" className="text-[var(--accent)] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
