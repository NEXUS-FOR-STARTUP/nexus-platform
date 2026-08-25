"use client";

import React, { useEffect, useRef, useState } from "react";
import OtpStepSection from "./OtpStepSection";
import NewPasswordStep from "./NewPasswordStep";

const RESET_EMAIL_KEY = "nexus.password-reset.email";

export default function ResetPasswordForm() {
  const didPrefill = useRef(false);
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState("");

  useEffect(() => {
    if (didPrefill.current) return;
    didPrefill.current = true;
    const stored = sessionStorage.getItem(RESET_EMAIL_KEY);
    if (stored) {
      setEmail(stored);
    }
  }, []);

  const handleVerified = (otpCode: string) => {
    setVerifiedOtp(otpCode);
    setStep("password");
  };

  const handleBackToOtp = () => {
    setStep("otp");
  };

  if (step === "otp") {
    return (
      <OtpStepSection
        email={email}
        onVerified={handleVerified}
      />
    );
  }

  return (
    <NewPasswordStep
      email={email}
      otp={verifiedOtp}
      onBackToOtp={handleBackToOtp}
    />
  );
}
