"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/trips?tab=wishlist");
  }, [router]);
  return null;
}
