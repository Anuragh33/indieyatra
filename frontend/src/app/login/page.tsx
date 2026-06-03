"use client";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-bg-primary via-bg-surface to-purple/20 border-r border-border">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-saffron/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple/30 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-gradient-purple flex items-center justify-center font-display text-white text-xl font-bold">
              i
            </div>
            <span className="font-display text-2xl font-bold">
              Indie<span className="text-purple">Yatra</span>
            </span>
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 chip bg-purple/10 text-purple border border-purple/20 mb-4">
              <Sparkles className="w-3 h-3" /> Welcome back
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight mb-4">
              Your journey
              <br />
              <span className="text-gradient-saffron">continues here</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-md">
              Sign in to access your bookings, track buses live, and plan your next trip with AI.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>Made in India</span>
            <span>•</span>
            <span>50,000+ verified travelers</span>
          </div>
        </div>
      </div>

      {/* Right — Clerk SignIn */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex md:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-gradient-purple flex items-center justify-center font-display text-white text-lg font-bold">
              i
            </div>
            <span className="font-display text-xl font-bold">
              Indie<span className="text-purple">Yatra</span>
            </span>
          </Link>
          <SignIn
            routing="hash"
            signUpUrl="/register"
            appearance={{
              baseTheme: isDark ? dark : undefined,
              variables: {
                colorBackground:       isDark ? "#1a2235" : "#ffffff",
                colorInputBackground:  isDark ? "#111827" : "#f1f5f9",
                colorInputText:        isDark ? "#f9fafb" : "#0f172a",
                colorText:             isDark ? "#f9fafb" : "#0f172a",
                colorTextSecondary:    isDark ? "#9ca3af" : "#475569",
                colorPrimary:          "#ff6b1a",
                colorDanger:           "#ef4444",
                borderRadius:          "0.5rem",
                fontFamily:            "DM Sans, system-ui, sans-serif",
              },
              elements: {
                card:                     "bg-[#1a2235] border border-white/10 shadow-xl",
                headerTitle:              "text-white font-bold",
                headerSubtitle:           "text-gray-400",
                socialButtonsBlockButton: "border border-white/10 bg-[#111827] text-white hover:bg-white/5",
                socialButtonsBlockButtonText: "text-white",
                dividerLine:              "bg-white/10",
                dividerText:              "text-gray-400",
                formFieldLabel:           "text-gray-200",
                formFieldInput:           "bg-[#111827] border-white/10 text-white placeholder-gray-500",
                formButtonPrimary:        "bg-orange-500 hover:bg-orange-600 text-white",
                footerActionText:         "text-gray-400",
                footerActionLink:         "text-orange-400 hover:text-orange-300",
                footer:                   "bg-[#111827]",
                footerPages:              "text-gray-400",
                identityPreviewText:      "text-white",
                identityPreviewEditButton:"text-orange-400",
                formResendCodeLink:       "text-orange-400",
                otpCodeFieldInput:        "bg-[#111827] border-white/10 text-white",
                alertText:                "text-gray-200",
                selectButton:             "bg-[#111827] border-white/10 text-white",
                selectOptionsContainer:   "bg-[#1a2235] border border-white/10",
                selectOption:             "text-white hover:bg-white/5",
                phoneNumberInput:         "bg-[#111827] text-white",
                formFieldInputGroup:      "bg-[#111827] border-white/10 text-white",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
