'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { authClient } from "@/app/lib/auth-client";
import { detectInjectionAttempt, isCanonicalAdmin } from "@/app/lib/security";

interface AdminLoginFormProps {
  initialError?: string;
  currentUserRole?: string;
  currentUserEmail?: string;
}

export default function AdminLoginForm({
  initialError,
  currentUserRole,
  currentUserEmail,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInjectionDetected, setIsInjectionDetected] = useState(false);

  useEffect(() => {
    if (initialError === "restricted_user_role") {
      setErrorMessage(
        "Access Denied: Standard 'User' role detected. Administrative console privileges are strictly restricted to canonical admin@younus.com credentials."
      );
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsInjectionDetected(false);

    // 1. INJECTION DETECTION COUNTERMEASURE
    // If an attacker attempts SQL injection, tautologies, or payload tampering:
    const hasInjection = detectInjectionAttempt(email, password);
    if (hasInjection) {
      setIsInjectionDetected(true);
      setErrorMessage(
        "⚠️ Security Defense Triggered: Injection attempt detected! Administrative privileges denied. Your session has been restricted to the 'User' role."
      );
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const res = await authClient.signIn.email({
        email: cleanEmail,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid credentials. Please verify your email and password.");
        setIsLoading(false);
        return;
      }

      // Check user role from result
      const user = res.data?.user as any;
      if (!isCanonicalAdmin(user)) {
        setErrorMessage(
          `Access Denied: Logged in with '${user?.role || "user"}' role. Only admin@younus.com has admin rights.`
        );
        setIsLoading(false);
        return;
      }

      // Canonical admin confirmed
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Sign in error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while signing in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neutral-800/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neutral-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black shadow-xl mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase tracking-wider">
            Bellaro
          </h1>
          <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1 font-semibold">
            Admin Console Login
          </p>
        </div>

        {/* Card */}
        <div className="bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Security Banner if Injection Detected */}
          {isInjectionDetected && (
            <div className="mb-6 p-4 bg-amber-950/60 border border-amber-600/70 rounded-2xl flex items-start gap-3 text-amber-200 text-xs sm:text-sm animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Injection Defense Active</p>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  Payload blocked. Attackers receive the standard <strong className="text-white">&apos;user&apos;</strong> role. Administrative console access is locked exclusively to canonical admin credentials.
                </p>
              </div>
            </div>
          )}

          {errorMessage && !isInjectionDetected && (
            <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-start gap-3 text-rose-200 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {currentUserEmail && currentUserRole === "user" && (
            <div className="mb-6 p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 text-xs flex items-center justify-between">
              <span>Logged in as: <strong className="text-white">{currentUserEmail}</strong> (Role: user)</span>
              <button
                type="button"
                onClick={async () => {
                  await authClient.signOut();
                  router.refresh();
                }}
                className="text-xs text-rose-400 hover:underline ml-2"
              >
                Sign Out
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-neutral-200 text-black text-sm font-bold rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Console</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bellaro Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
