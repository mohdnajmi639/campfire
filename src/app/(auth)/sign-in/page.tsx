"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Github, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="rounded-lg bg-discord-channel p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-campfire-orange to-campfire-ember shadow-lg">
          <Flame className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
        <p className="mt-1 text-discord-muted">
          We&apos;re so excited to see you again!
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-discord-red/10 p-3 text-sm text-discord-red animate-fade-in">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-sm bg-discord-darker p-2.5 text-sm text-discord-text outline-none transition-colors focus:ring-2 focus:ring-campfire-orange/50"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-sm bg-discord-darker p-2.5 text-sm text-discord-text outline-none transition-colors focus:ring-2 focus:ring-campfire-orange/50"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-campfire-orange py-2.5 text-sm font-medium text-white transition-colors hover:bg-campfire-ember disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Log In
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-discord-active" />
        <span className="text-xs text-discord-muted">OR</span>
        <div className="h-px flex-1 bg-discord-active" />
      </div>

      {/* OAuth */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuth("github")}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-discord-darker py-2.5 text-sm font-medium text-discord-text transition-colors hover:bg-discord-active"
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </button>
        <button
          onClick={() => handleOAuth("google")}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-discord-darker py-2.5 text-sm font-medium text-discord-text transition-colors hover:bg-discord-active"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-discord-muted">
        Need an account?{" "}
        <Link
          href="/sign-up"
          className="text-campfire-orange transition-colors hover:text-campfire-ember hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
