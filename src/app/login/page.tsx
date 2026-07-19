"use client";

import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px] left-0 top-0" />

      <div className="absolute h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[150px] right-0 bottom-0" />

      <LoginForm />

    </main>
  );
}