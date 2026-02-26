"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setTokens, setUser } from "../../lib/api";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client",
    inviteToken,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // If invite token, use invitation accept flow
      if (form.inviteToken) {
        const data = await api("/auth/invitations/accept", {
          method: "POST",
          body: {
            token: form.inviteToken,
            firstName: form.firstName,
            lastName: form.lastName,
            password: form.password,
          },
          noAuth: true,
        });
        setTokens(data.token, data.refreshToken);
        setUser(data.user);
      } else {
        const data = await api("/auth/register", {
          method: "POST",
          body: {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
          },
          noAuth: true,
        });
        setTokens(data.token, data.refreshToken);
        setUser(data.user);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">
            {inviteToken ? "Complete your registration" : "Join FitTracker"}
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={update("firstName")}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={update("lastName")}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          {!inviteToken && (
            <>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: "client" }))}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                      form.role === "client"
                        ? "bg-brand-500/20 border-brand-500 text-brand-400"
                        : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: "trainer" }))}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                      form.role === "trainer"
                        ? "bg-brand-500/20 border-brand-500 text-brand-400"
                        : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    Trainer
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
              minLength={8}
              required
            />
          </div>

          {inviteToken && (
            <input type="hidden" value={form.inviteToken} />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
