"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthSync() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      localStorage.setItem("user", JSON.stringify(session.user));
    }
  }, [session]);

  return null;
}
