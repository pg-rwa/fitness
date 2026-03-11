"use client";
import { Suspense, useState, useRef, useEffect } from "react";
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
  const isInvitation = searchParams.get("invitation") === "true";
  const prefillEmail = searchParams.get("email") || "";
  const inviteToken = searchParams.get("token") || "";

  // Steps: 1 = enter email, 2 = verify OTP, 3 = complete profile
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: prefillEmail,
    role: "client",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  const otpType = isInvitation ? "invitation" : "registration";

  // Token-based invitation: validate token and skip to step 3
  useEffect(() => {
    if (!inviteToken) return;
    setLoading(true);
    api(`/auth/invitations/token/${inviteToken}`, { noAuth: true })
      .then((data) => {
        setForm((f) => ({ ...f, email: data.email, role: data.role || "client" }));
        setStep(3);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const [devCode, setDevCode] = useState("");

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/otp/send", {
        method: "POST",
        body: { email: form.email, type: otpType },
        noAuth: true,
      });
      setStep(2);
      setCountdown(60);
      // If email delivery failed, the API returns the code directly
      if (data.code) {
        const digits = data.code.split("");
        setOtp(digits);
        setDevCode(data.code);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/otp/verify", {
        method: "POST",
        body: { email: form.email, code, type: otpType },
        noAuth: true,
      });
      setVerificationToken(data.verificationToken);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    setDevCode("");
    try {
      const data = await api("/auth/otp/send", {
        method: "POST",
        body: { email: form.email, type: otpType },
        noAuth: true,
      });
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      if (data.code) {
        const digits = data.code.split("");
        setOtp(digits);
        setDevCode(data.code);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  // Step 3: Complete registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let data;
      if (inviteToken) {
        // Token-based invitation: no OTP needed
        data = await api("/auth/invitations/accept-token", {
          method: "POST",
          body: {
            token: inviteToken,
            firstName: form.firstName,
            lastName: form.lastName,
            password: form.password,
          },
          noAuth: true,
        });
      } else if (isInvitation) {
        data = await api("/auth/invitations/accept", {
          method: "POST",
          body: {
            verificationToken,
            firstName: form.firstName,
            lastName: form.lastName,
            password: form.password,
          },
          noAuth: true,
        });
      } else {
        data = await api("/auth/register", {
          method: "POST",
          body: {
            verificationToken,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
          },
          noAuth: true,
        });
      }
      setTokens(data.token, data.refreshToken);
      setUser(data.user);
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
          <h1 className="text-white text-2xl font-bold">
            {step === 1 && (isInvitation ? "Accept Invitation" : "Create Account")}
            {step === 2 && "Verify Email"}
            {step === 3 && (inviteToken ? "Accept Invitation" : "Complete Profile")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && (isInvitation ? "Verify your email to get started" : "Enter your email to get started")}
            {step === 2 && `We sent a code to ${form.email}`}
            {step === 3 && (inviteToken ? "Set up your account to get started" : "Set up your account details")}
          </p>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? "w-8 bg-brand-500" : s < step ? "w-8 bg-brand-500/40" : "w-8 bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Email + Role */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
                placeholder="you@example.com"
                required
                autoFocus
                readOnly={!!prefillEmail}
              />
            </div>

            {!isInvitation && (
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {devCode && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
                <p className="text-yellow-400 text-xs font-medium">Email delivery unavailable — code auto-filled</p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-14 bg-gray-900 border border-gray-700 rounded-lg text-center text-white text-xl font-bold focus:border-brand-500 focus:outline-none"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="text-sm text-gray-400 hover:text-brand-500 disabled:text-gray-600 transition"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="w-full text-gray-500 text-sm hover:text-gray-300 transition"
            >
              Change email
            </button>
          </form>
        )}

        {/* Step 3: Profile Details */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-brand-400 text-sm">{form.email} verified</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={update("firstName")}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none text-sm"
                  required
                  autoFocus
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

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
