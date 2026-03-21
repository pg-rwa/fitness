import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Input } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isInvitation = params.invitation === "true";
  const prefillEmail = params.email || "";
  const { register } = useAuth();

  // Steps: 1 = email, 2 = OTP, 3 = profile
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: prefillEmail,
    role: "client",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  const otpType = isInvitation ? "invitation" : "registration";

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!form.email) return setError("Please enter your email");
    setLoading(true);
    setError("");
    try {
      const result = await api("/auth/otp/send", {
        method: "POST",
        body: { email: form.email.trim().toLowerCase(), type: otpType },
        noAuth: true,
      });
      setStep(2);
      setCountdown(60);
      // If email delivery failed, the API returns the code directly
      if (result.devMode && result.code) {
        setError(`Email not configured. Your code: ${result.code}`);
      }
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) return setError("Please enter the full 6-digit code");
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/otp/verify", {
        method: "POST",
        body: { email: form.email.trim().toLowerCase(), code, type: otpType },
        noAuth: true,
      });
      setVerificationToken(data.verificationToken);
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await api("/auth/otp/send", {
        method: "POST",
        body: { email: form.email.trim().toLowerCase(), type: otpType },
        noAuth: true,
      });
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      if (result.devMode && result.code) {
        setError(`Email not configured. Your code: ${result.code}`);
      }
    } catch (err) {
      setError(err.message || "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 3: Complete registration
  const handleRegister = async () => {
    if (!form.firstName || !form.password) return setError("Please fill in required fields");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    setError("");
    try {
      if (isInvitation) {
        await register({
          verificationToken,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          _acceptInvitation: true,
        });
      } else {
        await register({
          verificationToken,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          role: form.role,
        });
      }
      // Navigation handled by auth layout redirect when user state updates
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1) {
                if (step === 2) { setStep(1); setOtp(["", "", "", "", "", ""]); }
                else setStep(2);
                setError("");
              } else {
                router.back();
              }
            }}
            className="mt-2"
          >
            <Text className="text-primary text-base">Back</Text>
          </TouchableOpacity>

          <Text className="text-white text-2xl font-bold mt-8 mb-2">
            {step === 1 && (isInvitation ? "Accept Invitation" : "Create Account")}
            {step === 2 && "Verify Email"}
            {step === 3 && "Complete Profile"}
          </Text>
          <Text className="text-gray-400 mb-2">
            {step === 1 && "Enter your email to get started"}
            {step === 2 && `We sent a code to ${form.email}`}
            {step === 3 && "Set up your account details"}
          </Text>

          {/* Step indicator */}
          <View className="flex-row mb-6 gap-2">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                className={`h-1.5 rounded-full ${
                  s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/40" : "w-8 bg-gray-600"
                }`}
              />
            ))}
          </View>

          {error ? <Text className="text-red-400 text-sm mb-4">{error}</Text> : null}

          {/* Step 1: Email + Role */}
          {step === 1 && (
            <>
              <Input
                label="Email"
                value={form.email}
                onChangeText={update("email")}
                placeholder="your@email.com"
                keyboardType="email-address"
                icon="mail-outline"
                editable={!prefillEmail}
              />

              {!isInvitation && (
                <>
                  <Text className="text-gray-400 text-sm mb-2 ml-1">I am a</Text>
                  <View className="flex-row mb-5">
                    {["client", "trainer"].map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => update("role")(role)}
                        className={`flex-1 py-3 rounded-xl mr-2 items-center border ${
                          form.role === role ? "bg-primary border-primary" : "bg-dark-card border-gray-600"
                        }`}
                      >
                        <Text className="text-white font-semibold capitalize">{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Button title="Send Verification Code" onPress={handleSendOTP} loading={loading} className="mt-2 mb-4" />
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <View className="flex-row justify-center gap-2 mb-6">
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(i, val)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="w-12 h-14 bg-dark-card border border-gray-600 rounded-xl text-center text-white text-xl font-bold"
                    autoFocus={i === 0}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <Button
                title="Verify Code"
                onPress={handleVerifyOTP}
                loading={loading}
                className="mb-4"
              />

              <TouchableOpacity onPress={handleResend} disabled={countdown > 0} className="items-center mb-4">
                <Text className={countdown > 0 ? "text-gray-600 text-sm" : "text-primary text-sm"}>
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <>
              <View className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex-row items-center gap-2 mb-4">
                <Text className="text-primary text-sm">{form.email} verified</Text>
              </View>

              <Input label="First Name" value={form.firstName} onChangeText={update("firstName")} placeholder="John" icon="person-outline" />
              <Input label="Last Name" value={form.lastName} onChangeText={update("lastName")} placeholder="Doe" icon="person-outline" />
              <Input label="Password" value={form.password} onChangeText={update("password")} placeholder="Min 8 characters" secureTextEntry icon="lock-closed-outline" />

              <Button title="Create Account" onPress={handleRegister} loading={loading} className="mt-2 mb-4" />
            </>
          )}

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="pb-8 items-center">
            <Text className="text-gray-400">
              Already have an account? <Text className="text-primary font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
