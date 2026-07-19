"use client";

import Logo from "../common/Logo";
import GlassCard from "../glass/GlassCard";
import PrimaryButton from "../buttons/PrimaryButton";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <GlassCard className="mx-10 mt-6 flex items-center justify-between px-8 py-5">

      <Logo />

      <div className="flex items-center gap-5 text-sm text-white/80">

        <a href="#">Home</a>

        <a href="#">Features</a>

        <a href="#">Pricing</a>

        <a href="#">Contact</a>

      </div>

      <div className="w-40">
        <PrimaryButton onClick={() => router.push("/login")}>
          Get Started
        </PrimaryButton>
      </div>

    </GlassCard>
  );
}