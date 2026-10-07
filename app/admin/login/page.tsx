"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Created lazily inside the handler (not at render) so the page can be
    // prerendered without Supabase env set — e.g. a preview/demo deployment.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setError("Admin sign-in is not available in this environment.");
      setLoading(false);
      return;
    }
    const supabase = createBrowserClient(url, anon);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    router.push("/admin/ambassador");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-cream-2">
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .anim-shake { animation: shake 0.45s ease; }
        .anim-spin  { animation: spin 0.7s linear infinite; }
        .fade-up {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .fade-up.show {
          opacity: 1;
          transform: translateY(0);
        }
        .touch-target { min-height: 44px; min-width: 44px; }
        @media (max-width: 640px) {
          input, button, select { font-size: 16px; }
        }
      `}</style>

      <div className="w-full max-w-[400px] py-8 sm:py-0">

        {/* Card */}
        <div
          className={`bg-white rounded-2xl border border-black/[0.1] p-8 sm:p-10 shadow-card fade-up ${mounted ? "show" : ""} ${shake ? "anim-shake" : ""}`}
          style={{ transitionDelay: "0ms" }}
        >
          {/* Logo + heading inside card */}
          <div className="text-center mb-8">
            <Image
              src="/growqr-logo.png"
              alt="GrowQR"
              width={160}
              height={44}
              className="h-9 w-auto mx-auto mb-6"
              priority
            />
            <h1 className="text-[20px] sm:text-[22px] font-bold text-ink tracking-tight leading-none mb-1.5">
              Ambassador Program
            </h1>
            <p className="text-[13px] text-ink-4">Sign in to your admin account</p>
          </div>

          <div className="border-t border-black/[0.06] mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-ink-2 mb-2">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                disabled={loading}
                className="w-full px-4 py-3.5 sm:py-3 rounded-lg border border-black/[0.12] text-[16px] sm:text-[15px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60 transition-all placeholder:text-ink-4 disabled:opacity-60 touch-target"
                placeholder="admin@growqr.ai"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-ink-2 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  disabled={loading}
                  className="w-full px-4 py-3.5 sm:py-3 pr-12 rounded-lg border border-black/[0.12] text-[16px] sm:text-[15px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60 transition-all placeholder:text-ink-4 disabled:opacity-60 touch-target"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 text-ink-4 hover:text-ink-2 transition-colors touch-target"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" />
                    : <Eye className="w-5 h-5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <div
              style={{
                maxHeight: error ? "100px" : "0",
                opacity: error ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.25s ease, opacity 0.2s ease",
              }}
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-start gap-2 text-[13px] sm:text-[14px] text-red-600 bg-red-50 rounded-lg px-3.5 py-3 border border-red-100">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                <span>{error}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="relative w-full bg-orange text-white rounded-lg py-3.5 sm:py-3 text-[15px] sm:text-[15px] font-semibold hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden touch-target"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span
                    className="anim-spin inline-block w-4 h-4 rounded-full border-2 border-white/30"
                    style={{ borderTopColor: "white" }}
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
