"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-10 h-10 text-saffron mx-auto mb-3 animate-pulse" />
        <div className="font-display text-xl">Signing you in…</div>
      </div>
    </div>
  );
}
