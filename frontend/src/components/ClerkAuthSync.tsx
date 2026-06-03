"use client";
import { useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth as useLocalAuth } from "@/lib/auth";
import { setClerkTokenGetter } from "@/lib/api";

export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { setUser, logout: localLogout } = useLocalAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setClerkTokenGetter(() => getToken());
    } else {
      setClerkTokenGetter(null);
    }
  }, [isSignedIn, isLoaded, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && clerkUser) {
      setUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        full_name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? "",
        avatar_url: clerkUser.imageUrl ?? undefined,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? undefined,
      });
    } else if (!isSignedIn) {
      localLogout();
    }
  }, [isLoaded, isSignedIn, clerkUser, setUser, localLogout]);

  return null;
}
