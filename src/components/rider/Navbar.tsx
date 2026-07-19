"use client";

import { Bell, Menu, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="
      h-20
      rounded-3xl
      border
      border-white/10
      bg-white/5
      backdrop-blur-3xl
      px-8
      flex
      items-center
      justify-between
      shadow-[0_0_40px_rgba(0,255,255,.15)]
      "
    >
      <div className="flex items-center gap-4">
        <button className="rounded-xl bg-white/10 p-3 hover:bg-white/20 transition cursor-pointer">
          <Menu className="text-white" />
        </button>

        <div>
          <h1 className="text-white text-2xl font-black">
            RideX
          </h1>

          <p className="text-cyan-400 text-xs tracking-[4px]">
            RIDER
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative rounded-xl bg-white/10 p-3 hover:bg-white/20 transition cursor-pointer">
          <Bell className="text-white" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
        </button>

        <div className="relative group">
          <button className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 p-1 cursor-pointer">
            <UserCircle2
              size={42}
              className="text-white"
            />
          </button>

          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <button
              onClick={handleSignOut}
              className="w-full text-left rounded-xl px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition cursor-pointer font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}